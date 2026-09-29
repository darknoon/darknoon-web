import * as THREE from 'three';
import { SparkRenderer, SplatMesh, SplatFileType } from '@sparkjsdev/spark';
import { createDepthPortrait } from './portrait-depth';

interface PortraitCamera {
  width: number;
  height: number;
  verticalFov: number;
  focusDistance: number;
  cameraPosition?: [number, number, number];
  target?: [number, number, number];
  defaultAngle?: number;
  neutralYaw?: number;
  representation?: 'depth' | 'splats';
  texture?: string;
  bridgeDepthEdges?: boolean;
}

interface PortraitOptions { view?: 'splat' | 'photo' | 'gaussians'; angle?: number }

export async function mountPortrait(host: HTMLElement, signal: AbortSignal): Promise<() => void> {
  const canvas = host.querySelector('canvas')!;
  const art = host.dataset.presentation === 'art';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: art, powerPreference: 'low-power' });
  renderer.setClearColor(0xf8fafc, art ? 0 : 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let lastTime = 0;
  let ready = false;
  let disposed = false;
  let visible = true;
  let moving = false;
  let travel = 0.025;
  let neutralTravel = 0;
  let focusDistance = 0;
  let view: PortraitOptions['view'] = 'splat';
  let introStart: number | undefined;
  let drag: { pointerId: number; x: number; y: number; target: THREE.Vector2; moved: boolean } | undefined;
  const current = new THREE.Vector2();
  const target = new THREE.Vector2();
  const lookAt = new THREE.Vector3();
  const cameraOrigin = new THREE.Vector3();
  const spark = new SparkRenderer({ renderer, onDirty: requestFrame, sortRadial: false });
  let splats: SplatMesh | undefined;
  let depthPortrait: Awaited<ReturnType<typeof createDepthPortrait>> | undefined;
  scene.add(spark);

  function setState(state: string) {
    host.dataset.state = state;
    host.dispatchEvent(new CustomEvent('portrait-state', { detail: state }));
  }

  function requestFrame() {
    if (!frame && ready && visible && !disposed && !document.hidden && !reducedMotion.matches && view !== 'photo') {
      frame = requestAnimationFrame(render);
    }
  }

  function render(time: number) {
    frame = 0;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (introStart !== undefined) {
      const phase = Math.min(1, (time - introStart) / 3000);
      target.set(Math.sin(phase * Math.PI * 2) * Math.sin(phase * Math.PI) * .7, 0);
      if (phase === 1) { introStart = undefined; host.dataset.intro = 'complete'; }
    }
    current.lerp(target, 1 - Math.exp(-delta * 12));
    moving = current.distanceToSquared(target) > 0.000001;
    if (!moving) current.copy(target);
    updateCamera();
    renderer.render(scene, camera);
    if (moving || introStart !== undefined) requestFrame();
  }

  function updateCamera() {
    // The source photograph can already have a turned head. Rest at its
    // calibrated face-on view, but keep both endpoints inside the original
    // reconstruction's safe envelope instead of adding yaw to that envelope.
    const neutral = THREE.MathUtils.clamp(neutralTravel, -travel, travel);
    const x = current.x < 0
      ? THREE.MathUtils.lerp(neutral, -travel, -current.x)
      : THREE.MathUtils.lerp(neutral, travel, current.x);
    // Translate in the image plane; a fixed gaze keeps the face framed.
    camera.position.set(cameraOrigin.x + x, cameraOrigin.y + current.y * travel * 0.7, cameraOrigin.z);
    camera.lookAt(lookAt);
  }

  function stopIntro() {
    if (introStart === undefined) return;
    introStart = undefined;
    target.copy(current);
    host.dataset.intro = 'complete';
  }

  function resize() {
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    requestFrame();
  }

  function point(event: PointerEvent) {
    if (disposed || reducedMotion.matches || view === 'photo') return;
    stopIntro();
    const box = host.getBoundingClientRect();
    if (event.pointerType !== 'mouse') {
      if (drag?.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.moved ||= Math.hypot(dx, dy) > 5;
      // Relative dragging avoids a jump to whichever spot the finger lands on.
      target.set(
        THREE.MathUtils.clamp(drag.target.x + dx / box.width * 2, -1, 1),
        THREE.MathUtils.clamp(drag.target.y - dy / box.height * 2, -1, 1),
      );
      requestFrame();
      return;
    }
    target.set(
      THREE.MathUtils.clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - (event.clientY - box.top) / box.height * 2, -1, 1),
    );
    requestFrame();
  }

  function beginDrag(event: PointerEvent) {
    if (event.pointerType === 'mouse') { point(event); return; }
    if (!event.isPrimary || drag || disposed || reducedMotion.matches || view === 'photo') return;
    stopIntro();
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, target: target.clone(), moved: false };
    host.setPointerCapture(event.pointerId);
    host.dataset.dragging = 'true';
  }

  function endDrag(event?: PointerEvent) {
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    const { pointerId, moved } = drag;
    drag = undefined;
    delete host.dataset.dragging;
    if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId);
    // Leave a dragged view in place so it can be seen without a finger over it.
    // A tap recenters; an interrupted gesture also returns to the neutral view.
    if (!moved || event?.type !== 'pointerup') reset();
  }

  function reset() {
    stopIntro();
    target.set(0, 0);
    requestFrame();
  }

  function key(event: KeyboardEvent) {
    stopIntro();
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.2], ArrowDown: [0, -0.2],
    };
    if (event.key === 'Escape' || event.key === 'Home') {
      event.preventDefault();
      reset();
    } else if (steps[event.key]) {
      event.preventDefault();
      const [x, y] = steps[event.key];
      target.set(THREE.MathUtils.clamp(target.x + x, -1, 1), THREE.MathUtils.clamp(target.y + y, -1, 1));
      requestFrame();
    }
  }

  function options(event: Event) {
    const detail = (event as CustomEvent<PortraitOptions>).detail;
    if (detail.angle !== undefined && Number.isFinite(detail.angle)) {
      travel = focusDistance * Math.tan(THREE.MathUtils.degToRad(THREE.MathUtils.clamp(detail.angle, 0, 45)));
    }
    if (detail.view) {
      endDrag();
      view = detail.view;
      host.dataset.view = view;
      // Reduce the drawn Gaussian footprint to expose the reconstruction's
      // individual ellipsoids; this does not change the underlying geometry.
      spark.maxStdDev = view === 'gaussians' ? 0.65 : Math.sqrt(8);
      if (depthPortrait) depthPortrait.mesh.material.wireframe = view === 'gaussians';
      spark.setDirty();
    }
    requestFrame();
  }

  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestFrame();
    else { cancelAnimationFrame(frame); frame = 0; }
  });
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    endDrag();
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    splats?.dispose();
    depthPortrait?.dispose();
    spark.dispose();
    renderer.dispose();
  };
  signal.addEventListener('abort', cleanup, { once: true });

  try {
    // Fetch here so disconnection cancels downloads and HTTP failures reject
    // before entering the renderer's worker-based decoder.
    const model = host.dataset.model ?? 'sharp';
    const assetPath = ['trellis', 'moge', 'dav2', 'moge-splat', 'color-moge', 'color-moge-splat', 'color-sharp'].includes(model) ? `/splats/${model}` : '/splats';
    const cameraResponse = await fetch(`${assetPath}/portrait-camera.json`, { signal });
    if (!cameraResponse.ok) throw new Error(`Portrait metadata: ${cameraResponse.status}`);
    const metadata: PortraitCamera = await cameraResponse.json();
    const splatResponse = await fetch(`${assetPath}/${metadata.representation === 'depth' ? 'portrait-depth.bin' : 'portrait.spz'}`, { signal });
    if (!splatResponse.ok) throw new Error(`Portrait geometry: ${splatResponse.status}`);
    const fileBytes = await splatResponse.arrayBuffer();
    if (signal.aborted) { cleanup(); return cleanup; }
    if (metadata.representation === 'depth') {
      depthPortrait = await createDepthPortrait(fileBytes, metadata, signal);
      if (signal.aborted) { depthPortrait.dispose(); cleanup(); return cleanup; }
      scene.add(depthPortrait.mesh);
    } else {
      splats = new SplatMesh({ fileBytes, fileType: SplatFileType.SPZ, raycastable: false });
      // Gaussian exports use y-down coordinates. SHARP and sampled MoGe look
      // along +z; the preserved TRELLIS artifact has a different camera origin.
      splats.rotation.x = Math.PI;
      scene.add(splats);
    }
    camera.fov = metadata.verticalFov;
    camera.near = 0.01;
    camera.far = 10;
    focusDistance = metadata.focusDistance;
    cameraOrigin.fromArray(metadata.cameraPosition ?? [0, 0, 0]);
    camera.position.copy(cameraOrigin);
    lookAt.fromArray(metadata.target ?? [0, 0, -focusDistance]);
    if (metadata.defaultAngle !== undefined) travel = focusDistance * Math.tan(THREE.MathUtils.degToRad(metadata.defaultAngle));
    if (metadata.neutralYaw !== undefined && Number.isFinite(metadata.neutralYaw)) {
      neutralTravel = focusDistance * Math.tan(THREE.MathUtils.degToRad(THREE.MathUtils.clamp(metadata.neutralYaw, -45, 45)));
    }
    resize();
    await splats?.initialized;
    if (signal.aborted) { cleanup(); return cleanup; }
    updateCamera();
    // Await the initial sorting pass before replacing the photograph.
    await spark.update({ scene, camera });
    if (signal.aborted) { cleanup(); return cleanup; }
    ready = true;
    if (art) { introStart = performance.now(); host.dataset.intro = 'running'; }
    renderer.render(scene, camera);
    requestFrame();
    resizeObserver.observe(host);
    visibilityObserver.observe(host);
    host.addEventListener('pointermove', point, { signal });
    host.addEventListener('pointerdown', beginDrag, { signal });
    host.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') reset(); }, { signal });
    host.addEventListener('pointerup', endDrag, { signal });
    host.addEventListener('pointercancel', endDrag, { signal });
    host.addEventListener('lostpointercapture', endDrag, { signal });
    host.addEventListener('blur', () => { endDrag(); reset(); }, { signal });
    host.addEventListener('keydown', key, { signal });
    host.addEventListener('portrait-options', options, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { endDrag(); cancelAnimationFrame(frame); frame = 0; }
      else requestFrame();
    }, { signal });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) { endDrag(); cancelAnimationFrame(frame); frame = 0; }
      else requestFrame();
    }, { signal });
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      setState('unavailable');
      cleanup();
    }, { signal });
    setState('ready');
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}
