// Convert SHARP's binary PLY to a browser-sized SPZ and preserve its camera.
// Usage: node scripts/prepare-portrait-splat.mjs input.ply [output-directory]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { SpzWriter } from '@sparkjsdev/spark';
import sharp from 'sharp';

const [input, output = 'public/splats'] = process.argv.slice(2);
if (!input) throw new Error('Provide the PLY downloaded from the SHARP Space.');
const bytes = await readFile(input);
const marker = Buffer.from('end_header\n');
const headerEnd = bytes.indexOf(marker) + marker.length;
if (headerEnd < marker.length) throw new Error('Missing PLY header.');
const header = bytes.subarray(0, headerEnd).toString();
if (!header.includes('format binary_little_endian 1.0')) throw new Error('Expected binary little-endian PLY.');
const elements = [];
for (const line of header.trim().split('\n')) {
  const parts = line.split(' ');
  if (parts[0] === 'element') elements.push({ name: parts[1], count: Number(parts[2]), properties: [] });
  if (parts[0] === 'property') elements.at(-1).properties.push({ type: parts[1], name: parts[2] });
}
const sizes = { float: 4, uint: 4, int: 4, uchar: 1 };
let offset = headerEnd;
for (const element of elements) {
  element.offset = offset;
  element.stride = element.properties.reduce((size, property) => {
    if (!sizes[property.type]) throw new Error(`Unsupported property type: ${property.type}`);
    property.offset = size;
    return size + sizes[property.type];
  }, 0);
  offset += element.count * element.stride;
}
if (offset !== bytes.length) throw new Error('PLY byte count does not match its header.');
const vertices = elements.find(({ name }) => name === 'vertex');
const properties = Object.fromEntries(vertices.properties.map(({ name, offset }) => [name, offset]));
for (const name of ['x', 'y', 'z', 'opacity', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3']) {
  if (!(name in properties)) throw new Error(`Missing Gaussian property: ${name}`);
}
const get = (index, name) => bytes.readFloatLE(vertices.offset + index * vertices.stride + properties[name]);
const metadata = (name) => {
  const element = elements.find((element) => element.name === name);
  if (!element) throw new Error(`Missing SHARP camera metadata: ${name}`);
  return Array.from({ length: element.count }, (_, i) => element.properties[0].type === 'uint'
    ? bytes.readUInt32LE(element.offset + i * element.stride)
    : bytes.readFloatLE(element.offset + i * element.stride));
};
const [width, height] = metadata('image_size');
const [focalLength] = metadata('intrinsic');
const sourceImage = 'src/assets/resources/wubba-lubba-dub-dub.jpg';
const { data: pixels, info } = await sharp(sourceImage).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== width || info.height !== height) throw new Error('Source photograph and SHARP camera dimensions differ.');
function sampleColor(index) {
  const z = get(index, 'z');
  const x = Math.max(0, Math.min(width - 1, get(index, 'x') / z * focalLength + width / 2));
  const y = Math.max(0, Math.min(height - 1, get(index, 'y') / z * focalLength + height / 2));
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1), y1 = Math.min(y0 + 1, height - 1);
  const dx = x - x0, dy = y - y0;
  return [0, 1, 2].map((channel) => (
    pixels[(y0 * width + x0) * 3 + channel] * (1 - dx) * (1 - dy)
    + pixels[(y0 * width + x1) * 3 + channel] * dx * (1 - dy)
    + pixels[(y1 * width + x0) * 3 + channel] * (1 - dx) * dy
    + pixels[(y1 * width + x1) * 3 + channel] * dx * dy
  ) / 255);
}
const selected = [];
const faceDepths = [];
for (let index = 0; index < vertices.count; index++) {
  // Only remove effectively invisible splats; preserve both predicted layers.
  const opacity = 1 / (1 + Math.exp(-get(index, 'opacity')));
  if (opacity < 1 / 255 || !Number.isFinite(get(index, 'z'))) continue;
  selected.push(index);
  const z = get(index, 'z');
  if (Math.abs(get(index, 'x') / z) < 0.08 && Math.abs(get(index, 'y') / z) < 0.08) faceDepths.push(z);
}
faceDepths.sort((a, b) => a - b);
const writer = new SpzWriter({ numSplats: selected.length, shDegree: 0, fractionalBits: 16, flagAntiAlias: false });
for (let i = 0; i < selected.length; i++) {
  const index = selected[i];
  writer.setCenter(i, get(index, 'x'), get(index, 'y'), get(index, 'z'));
  writer.setAlpha(i, 1 / (1 + Math.exp(-get(index, 'opacity'))));
  writer.setRgb(i, ...sampleColor(index));
  writer.setScale(i, ...[0, 1, 2].map((axis) => Math.exp(get(index, `scale_${axis}`))));
  writer.setQuat(i, get(index, 'rot_1'), get(index, 'rot_2'), get(index, 'rot_3'), get(index, 'rot_0'));
}
if (writer.clippedCount) throw new Error(`${writer.clippedCount} positions clipped during quantization.`);
const spz = await writer.finalize();
const camera = {
  width, height, focalLength,
  verticalFov: 2 * Math.atan(height / (2 * focalLength)) * 180 / Math.PI,
  focusDistance: faceDepths[Math.floor(faceDepths.length / 2)],
  splatCount: selected.length,
  bytes: spz.length,
  inputSha256: createHash('sha256').update(bytes).digest('hex'),
  colorSource: sourceImage,
  colorMethod: 'Bilinear reprojection of the original sRGB photograph through the SHARP camera',
  source: 'https://huggingface.co/spaces/gagndeep/Apple-Sharp-Image-to-3D-View-Synthesis',
};
await mkdir(output, { recursive: true });
await writeFile(join(output, 'portrait.spz'), spz);
await writeFile(join(output, 'portrait-camera.json'), JSON.stringify(camera, null, 2) + '\n');
console.log(camera);
