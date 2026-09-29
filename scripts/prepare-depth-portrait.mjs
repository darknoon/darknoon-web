// Photo-preserving depth mesh and Gaussian experiments (no synthesized texture).
// Usage: node scripts/prepare-depth-portrait.mjs moge|dav2 depth-file output-dir [source-image vertical-fov]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { FloatType } from 'three';
import { SpzWriter } from '@sparkjsdev/spark';
import sharp from 'sharp';

const [model, input, output, sourceImage, fovArgument] = process.argv.slice(2);
if (!['moge', 'dav2'].includes(model) || !input || !output) throw new Error('Expected moge|dav2 depth-file output-dir');
const original = sourceImage ?? 'src/assets/resources/wubba-lubba-dub-dub.jpg';
const verticalFov = Number(fovArgument ?? 37.2);
if (sourceImage && !fovArgument) throw new Error('Supply the reported vertical FOV for a new source photo.');
if (!Number.isFinite(verticalFov) || verticalFov <= 0 || verticalFov >= 150) throw new Error('Invalid FOV.');
const texturePath = sourceImage ? join(output, 'portrait-bw.webp') : 'public/splats/portrait-bw.webp';
if (!texturePath.startsWith('public/')) throw new Error('Output must be under public/.');
const originalBytes = await readFile(original);
const sourceInfo = await sharp(originalBytes).rotate().toBuffer({ resolveWithObject: true });
const bytes = await readFile(input);
let sourceWidth, sourceHeight, sample;
if (model === 'moge') {
  const exr = new EXRLoader().setDataType(FloatType).parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  sourceWidth = exr.width; sourceHeight = exr.height;
  // Three's EXR decoder returns bottom-up rows; image UVs here are top-down.
  const channels = exr.data.length / (exr.width * exr.height);
  sample = (x, y) => exr.data[((exr.height - 1 - y) * exr.width + x) * channels];
} else {
  const { data, info } = await sharp(bytes).greyscale().raw().toBuffer({ resolveWithObject: true });
  sourceWidth = info.width; sourceHeight = info.height;
  // DAV2 is relative inverse depth, not measured distance. This mapping is
  // an explicit display calibration, not a metric reconstruction claim.
  sample = (x, y) => 1 / (1 / 5.7 + data[y * info.width + x] / 255 * (1 / 3.65 - 1 / 5.7));
}
const height = 640, width = Math.round(height * sourceWidth / sourceHeight);
const depth = new Float32Array(width * height);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const sx = x / (width - 1) * (sourceWidth - 1), sy = y / (height - 1) * (sourceHeight - 1);
  const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(x0 + 1, sourceWidth - 1), y1 = Math.min(y0 + 1, sourceHeight - 1);
  const dx = sx - x0, dy = sy - y0;
  const value = sample(x0, y0) * (1 - dx) * (1 - dy) + sample(x1, y0) * dx * (1 - dy) + sample(x0, y1) * (1 - dx) * dy + sample(x1, y1) * dx * dy;
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid depth at ${x}, ${y}`);
  depth[y * width + x] = value;
}
const focalY = 1 / (2 * Math.tan(verticalFov * Math.PI / 360));
const faceDepth = depth[Math.floor(height * .5) * width + Math.floor(width * .5)];
const metadata = {
  model: model === 'moge' ? 'MoGe-2 (Ultra)' : 'Depth Anything V2 Large',
  representation: 'depth', width, height, verticalFov,
  sourceWidth: sourceInfo.info.width, sourceHeight: sourceInfo.info.height,
  focusDistance: faceDepth, defaultAngle: sourceImage ? 2 : 4, texture: texturePath.replace(/^public/, ''),
  textureSource: sourceImage ? basename(original) : original,
  sourceImageSha256: createHash('sha256').update(originalBytes).digest('hex'),
  appearance: 'Original photograph, grayscale; no synthesized facial texture',
  bridgeDepthEdges: Boolean(sourceImage),
  source: model === 'moge' ? 'https://huggingface.co/spaces/Ruicheng/MoGe-2' : 'https://huggingface.co/spaces/depth-anything/Depth-Anything-V2',
  inputSha256: createHash('sha256').update(bytes).digest('hex'),
  depthMapping: model === 'moge' ? `Native predicted depth; vertical FOV ${verticalFov} degrees reported by the hosted model` : 'Relative inverse depth mapped to 3.65–5.7 arbitrary units; FOV borrowed from MoGe for comparison',
  depthRange: [depth.reduce((a, b) => Math.min(a, b), Infinity), depth.reduce((a, b) => Math.max(a, b), -Infinity)],
};
await mkdir(output, { recursive: true });
await sharp(original).rotate().toColourspace('srgb').greyscale().resize({ height: 1600, withoutEnlargement: true }).webp({ quality: 95 }).toFile(texturePath);
const littleEndianDepth = Buffer.alloc(depth.length * 4);
depth.forEach((value, i) => littleEndianDepth.writeFloatLE(value, i * 4));
await writeFile(`${output}/portrait-depth.bin`, littleEndianDepth);
await writeFile(`${output}/portrait-camera.json`, JSON.stringify(metadata, null, 2) + '\n');
if (model === 'moge') {
  const colors = await sharp(original).rotate().toColourspace('srgb').greyscale().resize(width, height).raw().toBuffer();
  const writer = new SpzWriter({ numSplats: depth.length, shDegree: 0, fractionalBits: 16, flagAntiAlias: false });
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x, z = depth[i];
    const px = z / (height * focalY);
    writer.setCenter(i, (x / (width - 1) - .5) * width / height * z / focalY, (y / (height - 1) - .5) * z / focalY, z);
    writer.setScale(i, px * .62, px * .62, px * .1);
    writer.setQuat(i, 0, 0, 0, 1);
    writer.setAlpha(i, .99);
    const gray = colors[i] / 255;
    writer.setRgb(i, gray, gray, gray);
  }
  if (writer.clippedCount) throw new Error('Clipped Gaussian coordinates');
  const splats = await writer.finalize();
  await mkdir(`${output}-splat`, { recursive: true });
  await writeFile(`${output}-splat/portrait.spz`, splats);
  await writeFile(`${output}-splat/portrait-camera.json`, JSON.stringify({ ...metadata, representation: 'splats', splatCount: depth.length, bytes: splats.length, splatMethod: 'One flattened Gaussian per sampled photo pixel at MoGe depth; not learned Gaussian reconstruction' }, null, 2) + '\n');
  console.log({ splats: depth.length, bytes: splats.length });
}
console.log(metadata);
