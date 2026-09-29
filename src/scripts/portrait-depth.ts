import * as THREE from 'three';

export async function createDepthPortrait(
  bytes: ArrayBuffer,
  metadata: { width: number; height: number; verticalFov: number; texture?: string; bridgeDepthEdges?: boolean },
  signal: AbortSignal,
) {
  const { width, height, verticalFov } = metadata;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 2 || height < 2 || width * height * 4 !== bytes.byteLength) {
    throw new Error('Invalid portrait depth map');
  }
  const depth = new DataView(bytes);
  const columns = Math.ceil((width - 1) / 2) + 1;
  const rows = Math.ceil((height - 1) / 2) + 1;
  const positions = new Float32Array(columns * rows * 3);
  const uvs = new Float32Array(columns * rows * 2);
  const depths = new Float32Array(columns * rows);
  const tan = Math.tan(THREE.MathUtils.degToRad(verticalFov) / 2);
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const px = Math.min(x * 2, width - 1), py = Math.min(y * 2, height - 1);
    const i = y * columns + x, z = depth.getFloat32((py * width + px) * 4, true);
    if (!Number.isFinite(z) || z <= 0) throw new Error('Invalid portrait depth');
    const u = px / (width - 1), v = py / (height - 1);
    positions.set([(u - .5) * 2 * z * tan * width / height, (.5 - v) * 2 * z * tan, -z], i * 3);
    uvs.set([u, 1 - v], i * 2);
    depths[i] = z;
  }
  const indices: number[] = [];
  const triangle = (a: number, b: number, c: number) => {
    // The room-background comparison keeps the surface continuous: cutting
    // every jump leaves a white halo even at the source camera. Bridging avoids
    // that halo but can stretch edge pixels at wider angles; it invents no texture.
    if (metadata.bridgeDepthEdges || Math.max(depths[a], depths[b], depths[c]) / Math.min(depths[a], depths[b], depths[c]) < 1.06) indices.push(a, b, c);
  };
  for (let y = 0; y < rows - 1; y++) for (let x = 0; x < columns - 1; x++) {
    const i = y * columns + x;
    triangle(i, i + columns, i + 1);
    triangle(i + 1, i + columns, i + columns + 1);
  }
  const texture = await new THREE.TextureLoader().loadAsync(metadata.texture!);
  if (signal.aborted) { texture.dispose(); throw new DOMException('Aborted', 'AbortError'); }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, dispose: () => { texture.dispose(); geometry.dispose(); material.dispose(); } };
}
