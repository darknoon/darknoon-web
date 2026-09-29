// Preserve TRELLIS Gaussian geometry and appearance; only center and compress.
// Usage: node scripts/prepare-trellis-splat.mjs input.ply [output-directory]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { SpzWriter } from '@sparkjsdev/spark';

const [input, output = 'public/splats/trellis'] = process.argv.slice(2);
if (!input) throw new Error('Provide the Gaussian PLY exported by TRELLIS.');
const bytes = await readFile(input);
const marker = Buffer.from('end_header\n');
const headerEnd = bytes.indexOf(marker) + marker.length;
if (headerEnd < marker.length) throw new Error('Missing PLY header.');
const header = bytes.subarray(0, headerEnd).toString();
if (!header.includes('format binary_little_endian 1.0')) throw new Error('Expected binary little-endian PLY.');
const count = Number(header.match(/^element vertex (\d+)$/m)?.[1]);
if (!Number.isSafeInteger(count) || count < 1) throw new Error('Invalid vertex count.');
if (header.match(/^element /gm)?.length !== 1) throw new Error('Expected only a vertex element.');
const fields = [...header.matchAll(/^property (\S+) (\S+)$/gm)];
if (fields.some(field => field[1] !== 'float')) throw new Error('Expected float Gaussian properties.');
const properties = Object.fromEntries(fields.map((field, i) => [field[2], i * 4]));
for (const name of ['x', 'y', 'z', 'opacity', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3']) {
  if (!(name in properties)) throw new Error(`Missing Gaussian property: ${name}`);
}
const stride = fields.length * 4;
if (bytes.length !== headerEnd + count * stride) throw new Error('PLY length does not match header.');
const get = (index, field) => bytes.readFloatLE(headerEnd + index * stride + properties[field]);
const axes = ['x', 'y', 'z'];
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
const selected = [];
for (let i = 0; i < count; i++) {
  if (fields.some(field => !Number.isFinite(get(i, field[2])))) throw new Error(`Non-finite vertex ${i}.`);
  if (1 / (1 + Math.exp(-get(i, 'opacity'))) < 1 / 255) continue;
  selected.push(i);
  axes.forEach((axis, j) => { min[j] = Math.min(min[j], get(i, axis)); max[j] = Math.max(max[j], get(i, axis)); });
}
if (!selected.length) throw new Error('No visible Gaussians.');
const center = min.map((value, i) => (value + max[i]) / 2);
const extent = min.map((value, i) => max[i] - value);
const writer = new SpzWriter({ numSplats: selected.length, shDegree: 0, fractionalBits: 16, flagAntiAlias: false });
const shC0 = 0.28209479177387814;
for (let i = 0; i < selected.length; i++) {
  const vertex = selected[i];
  writer.setCenter(i, ...axes.map((axis, j) => get(vertex, axis) - center[j]));
  writer.setAlpha(i, 1 / (1 + Math.exp(-get(vertex, 'opacity'))));
  writer.setRgb(i, ...[0, 1, 2].map(j => Math.max(0, Math.min(1, 0.5 + shC0 * get(vertex, `f_dc_${j}`)))));
  writer.setScale(i, ...[0, 1, 2].map(j => Math.exp(get(vertex, `scale_${j}`))));
  writer.setQuat(i, get(vertex, 'rot_1'), get(vertex, 'rot_2'), get(vertex, 'rot_3'), get(vertex, 'rot_0'));
}
if (writer.clippedCount) throw new Error(`${writer.clippedCount} positions clipped.`);
const spz = await writer.finalize();
const verticalFov = 40;
// Fit the complete generated bust in the existing portrait-shaped viewport.
// TRELLIS coordinates have arbitrary scale: this is not a metric measurement.
const aspect = 1422 / 1894;
const fitDistance = Math.max(extent[1], extent[0] / aspect) / (2 * Math.tan(verticalFov * Math.PI / 360));
const distance = fitDistance * 1.12 + extent[2] / 2;
const inputSha256 = createHash('sha256').update(bytes).digest('hex');
// Only attribute the recorded run's settings to its exact exported file.
const recordedRun = inputSha256 === '522af3250c37290ac13594fe9511860d094d86767d2b1f403f992ba18964bc85';
const metadata = {
  width: 1422, height: 1894, verticalFov, focusDistance: distance,
  cameraPosition: [0, 0, distance], target: [0, 0, 0], defaultAngle: 28,
  model: 'TRELLIS-image-large', splatCount: selected.length, bytes: spz.length,
  inputSha256,
  source: 'https://huggingface.co/spaces/trellis-community/TRELLIS',
  sourceRevision: recordedRun ? '91c1b5afbf24094b3ec7d8a27ae2e49608bd668f' : undefined,
  generation: recordedRun ? { seed: 42, sparseStructureSteps: 25, structuredLatentSteps: 25, sparseGuidance: 7.5, latentGuidance: 3 } : undefined,
  colorMethod: 'Native TRELLIS spherical-harmonic DC colors; no photograph reprojection',
  coordinates: 'TRELLIS PLY centered at bounding-box midpoint; viewer rotates X by pi; arbitrary scale',
  bounds: { min, max, center, extent },
};
await mkdir(output, { recursive: true });
await writeFile(join(output, 'portrait.spz'), spz);
await writeFile(join(output, 'portrait-camera.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(metadata);
