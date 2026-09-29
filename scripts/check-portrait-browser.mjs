// Run against an isolated Chromium CDP browser with the preview page open.
// Usage: node scripts/check-portrait-browser.mjs ws://... [http://127.0.0.1:5961] [color]
// Touch emulation verifies behavior; it is not a physical iPhone GPU test.
import { writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('.comparison', { recursive: true });
const origin = process.argv[3] ?? 'http://127.0.0.1:5961';
const colorSource = process.argv[4] === 'color';
if (colorSource) {
  // The color route is now the native SHARP presentation, not the old lab UI.
  await import('./review-native-portrait.mjs');
  process.exit(0);
}
const route = colorSource ? '/splat/color/' : '/splat/';
const baseModel = colorSource ? 'color-moge-splat' : 'moge';
const models = colorSource ? ['color-moge'] : ['moge-splat', 'dav2'];
const ws = new WebSocket(process.argv[2]);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const requests = new Map();
const errors = [];
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  if (requests.has(message.id)) {
    const { resolve, reject, timer } = requests.get(message.id);
    requests.delete(message.id); clearTimeout(timer);
    if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
  }
};
function call(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { requests.delete(id); reject(new Error(`Timed out: ${method}`)); }, 10000);
    requests.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
const target = (await call('Target.getTargets')).targetInfos.find(t => t.url.startsWith(origin) && t.type === 'page');
if (!target) throw new Error(`Open ${origin}/splat/ in the isolated browser first.`);
const { sessionId } = await call('Target.attachToTarget', { targetId: target.targetId, flatten: true });
const cdp = (method, params) => call(method, params, sessionId);
const evaluate = async (expression) => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function assert(condition, message) { if (!condition) throw new Error(message); }
async function waitReady() {
  for (let i = 0; i < 100; i++) {
    if (await evaluate('document.querySelector("splat-portrait")?.dataset.state === "ready"')) return;
    await pause(100);
  }
  throw new Error('Portrait not ready');
}
async function touch(type, points) {
  await cdp('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y, id = 1]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
}
async function swipe(x, y, dx, dy) {
  await touch('touchStart', [[x, y]]);
  for (let i = 1; i <= 10; i++) { await touch('touchMove', [[x + dx * i / 10, y + dy * i / 10]]); await pause(20); }
  await touch('touchEnd', []);
  await pause(800);
}
try {
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await cdp('Page.navigate', { url: `${origin}${route}` });
  await waitReady();
  await pause(500);
  const box = await evaluate('document.querySelector("splat-portrait").getBoundingClientRect().toJSON()');
  const expectedAspect = colorSource ? 1034 / 1124 : 1422 / 1894;
  assert(Math.abs(box.width / box.height - expectedAspect) < 0.001, 'Source photo framing changed');
  if (colorSource) assert(await evaluate('document.querySelector("splat-portrait img").getAttribute("src") === "/splats/color-moge/portrait-bw.webp"'), 'Wrong source photograph in fallback');
  const clip = { x: box.x + 15, y: box.y + 15, width: box.width - 30, height: box.height - 60, scale: 1 };
  const screenshot = async (name) => {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', clip });
    const png = Buffer.from(data, 'base64');
    await writeFile(`.comparison/${colorSource ? 'color-' : ''}touch-${name}.png`, png);
    return sharp(png).removeAlpha().raw().toBuffer();
  };
  const difference = (a, b) => a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const config = await evaluate('({touchAction:getComputedStyle(document.querySelector("splat-portrait")).touchAction,coarse:matchMedia("(any-pointer:coarse)").matches,overflow:document.documentElement.scrollWidth>innerWidth})');
  assert(config.touchAction === 'pinch-zoom' && config.coarse && !config.overflow, 'Mobile touch CSS incorrect');
  const center = await screenshot('center');
  await swipe(x, y, 90, 0);
  assert(await evaluate('scrollY === 0'), 'Horizontal portrait gesture scrolled the page');
  const horizontal = await screenshot('horizontal');
  assert(difference(center, horizontal) > 0.3, 'Horizontal touch did not change the rendered camera view');
  await pause(400);
  const held = await screenshot('held');
  assert(difference(horizontal, held) < 0.1, 'Camera did not hold after release');
  await touch('touchStart', [[x, y]]); await touch('touchEnd', []); await pause(900);
  const reset = await screenshot('reset');
  assert(difference(center, reset) < 0.3, 'Tap did not return to the original camera view');
  await swipe(x, y, 0, 110);
  assert(await evaluate('scrollY === 0'), 'Vertical portrait gesture scrolled the page');
  const vertical = await screenshot('vertical');
  assert(difference(reset, vertical) > 0.3, 'Vertical touch did not change the camera view');
  assert(await evaluate('!document.querySelector("splat-portrait").hasAttribute("data-dragging")'), 'Pointer capture did not end');
  await touch('touchStart', [[x, y]]); await touch('touchMove', [[x + 30, y + 20]]); await touch('touchCancel', []); await pause(800);
  assert(await evaluate('!document.querySelector("splat-portrait").hasAttribute("data-dragging")'), 'Cancelled gesture remained captured');
  await swipe(195, 755, 0, -210);
  const scrolled = await evaluate('scrollY');
  assert(scrolled > 80, 'Swipe outside portrait did not scroll');
  console.log(JSON.stringify({ ...config, horizontalDifference: difference(center, horizontal), heldDifference: difference(horizontal, held), resetDifference: difference(center, reset), verticalDifference: difference(reset, vertical), outsideScrollY: scrolled }));
  await evaluate('window.scrollTo(0, 0)');
  const selectModel = async model => {
    await evaluate(`(() => { const select = document.querySelector('#model'); select.value = '${model}'; select.dispatchEvent(new Event('change')); })()`);
    await waitReady(); await pause(700);
    assert(await evaluate('!document.querySelector("fieldset").disabled'), 'Model switch left controls disabled');
  };
  if (!colorSource) {
  await selectModel('sharp');
  const sharpCenter = await screenshot('sharp-center');
  assert(difference(center, sharpCenter) > 5, 'Model selector did not change the reconstruction');
  await swipe(x, y, 90, 0);
  const sharpMoved = await screenshot('sharp-moved');
  assert(difference(sharpCenter, sharpMoved) > 0.3, 'SHARP no longer responds to touch');
  }
  await selectModel(baseModel);
  const photoDepthCenter = await screenshot('moge-return');
  assert(difference(center, photoDepthCenter) < 0.3, 'Switching back did not restore MoGe');
  const selectView = async view => {
    await evaluate(`(() => { const radio = document.querySelector('input[value="${view}"]'); radio.checked = true; radio.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    await pause(700);
  };
  await selectView('photo');
  assert(await evaluate('getComputedStyle(document.querySelector("splat-portrait canvas")).opacity === "0"'), 'Photo comparison still shows canvas');
  const photo = await screenshot('original-photo');
  console.log(JSON.stringify({ originalPhotoDifference: difference(photoDepthCenter, photo) }));
  let colorSpread = 0;
  for (let i = 0; i < photoDepthCenter.length; i += 3) colorSpread += Math.max(...photoDepthCenter.subarray(i, i + 3)) - Math.min(...photoDepthCenter.subarray(i, i + 3));
  assert(colorSpread / (photoDepthCenter.length / 3) < 0.01, 'Portrait is not black and white');
  await selectView('gaussians');
  const gaussians = await screenshot('gaussians');
  assert(difference(photoDepthCenter, gaussians) > 0.3, 'Structure visualization did not change rendering');
  await selectView('splat');
  await evaluate('(() => { const range = document.querySelector("#travel"); range.value = range.max; range.dispatchEvent(new Event("input")); })()');
  await swipe(x, y, box.width / 2, 0);
  await screenshot('profile');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert(await evaluate('getComputedStyle(document.querySelector("canvas")).display === "none"'), 'Reduced motion did not restore static photo');
  await cdp('Emulation.setEmulatedMedia', { features: [] });
  for (const model of models) {
    await selectModel(model);
    const neutral = await screenshot(`${model}-center`);
    await swipe(x, y, 90, 0);
    const moved = await screenshot(`${model}-moved`);
    assert(difference(neutral, moved) > .3, `${model} did not respond to touch`);
    console.log(JSON.stringify({ model, originalPhotoDifference: difference(neutral, photo), motionDifference: difference(neutral, moved) }));
  }
  // Cancel two in-flight mounts, then prove the final selection still works.
  const rapidModels = [baseModel, models[0], baseModel, models.at(-1)];
  await evaluate(`(() => { const select = document.querySelector("#model"); for (const model of ${JSON.stringify(rapidModels)}) { select.value = model; select.dispatchEvent(new Event("change")); } })()`);
  await waitReady();
  assert(await evaluate('document.querySelector("splat-portrait").dataset.model') === models.at(-1), 'Rapid switch selected the wrong model');
  assert(errors.length === 0, `Browser exceptions: ${JSON.stringify(errors)}`);
  console.log(`${route}: model switching, B/W appearance, framing, structure/photo comparison, maximum angle, and reduced motion passed.`);
  await cdp('Page.navigate', { url: `${origin}/` });
  await waitReady();
  console.log('Home portrait loaded automatically on a visible touch screen.');
} finally {
  ws.close();
}
