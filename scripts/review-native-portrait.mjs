// Isolated Chromium CDP review of the native portrait, not a physical-phone test.
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const [endpoint, origin='https://prefix-mini.tail06618c.ts.net:5960'] = process.argv.slice(2);
await mkdir('.comparison/native', { recursive:true });
const ws = new WebSocket(endpoint);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let next=0;
const pending=new Map(), exceptions=[];
ws.onmessage=({data})=>{
  const m=JSON.parse(data);
  if(m.method==='Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails);
  const p=pending.get(m.id);
  if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(m.error):p.resolve(m.result);}
};
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
  const id=++next;
  const timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timed out'));},20000);
  pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,sessionId}));
});
const targets=await call('Target.getTargets');
const target=targets.targetInfos.find(t=>t.type==='page'&&t.url.startsWith(origin));
if(!target)throw new Error('Open the preview in an isolated browser first');
const {sessionId}=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
const cdp=(method,params)=>call(method,params,sessionId);
const evaluate=async expression=>{
  const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function difference(a,b){
  const x=await sharp(a).removeAlpha().raw().toBuffer(),y=await sharp(b).removeAlpha().raw().toBuffer();
  if(x.length!==y.length)throw new Error('Screenshot sizes differ');
  return x.reduce((sum,value,i)=>sum+Math.abs(value-y[i]),0)/x.length;
}
async function ready(){
  for(let i=0;i<200;i++){
    if(await evaluate('document.querySelector("splat-portrait")?.dataset.state === "ready" && document.querySelector("splat-portrait")?.dataset.intro !== "running"')){await pause(700);return;}
    await pause(100);
  }
  throw new Error('Native portrait did not become ready');
}
async function capture(name,clip){
  const {data}=await cdp('Page.captureScreenshot',{format:'png',...(clip?{clip}:{})});
  const bytes=Buffer.from(data,'base64');
  await writeFile(`.comparison/native/${name}.png`,bytes);
  return bytes;
}
const options=detail=>evaluate(`document.querySelector('splat-portrait').dispatchEvent(new CustomEvent('portrait-options',{detail:${JSON.stringify(detail)}}))`);
try {
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:2,mobile:false});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await cdp('Page.navigate',{url:origin+'/splat/color/'});
  await ready();
  await capture('desktop');
  const box=await evaluate('document.querySelector("splat-portrait").getBoundingClientRect().toJSON()');
  const clip={x:box.x,y:box.y,width:box.width,height:box.height,scale:1};
  await capture('neutral',clip);
  // Export the actual neutral Gaussian rendering as the loading/reduced-motion poster.
  await evaluate('document.documentElement.style.background="transparent"; document.body.style.background="transparent"');
  await cdp('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
  const poster=await capture('poster',clip);
  await sharp(poster).webp({lossless:true}).toFile('public/splats/color-sharp/portrait-poster.webp');
  await evaluate('document.documentElement.style.background=""; document.body.style.background=""');
  await cdp('Emulation.setDefaultBackgroundColorOverride',{});
  const y=box.y+box.height/2;
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x+box.width*.96,y});await pause(900);
  await capture('right',clip);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x+box.width*.04,y});await pause(900);
  await capture('left',clip);
  await options({angle:7});
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x+box.width*.96,y});await pause(900);await capture('right-seven',clip);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x+box.width*.04,y});await pause(900);await capture('left-seven',clip);
  await options({angle:4});
  await options({view:'gaussians'});await pause(400);await capture('structure',clip);
  await options({view:'splat'});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await cdp('Page.navigate',{url:origin+'/splat/color/'});await ready();
  const mobileNeutral=await capture('mobile');
  const mobile=await evaluate('document.querySelector("splat-portrait").getBoundingClientRect().toJSON()');
  if(await evaluate('document.documentElement.scrollWidth > innerWidth'))throw new Error('Mobile overflows');
  const mx=mobile.x+mobile.width*.45,my=mobile.y+mobile.height*.45;
  const touch=(type,points)=>cdp('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({x,y,id:1,radiusX:8,radiusY:8,force:1}))});
  await touch('touchStart',[[mx,my]]);
  for(let i=1;i<=10;i++){await touch('touchMove',[[mx+i*10,my]]);await pause(20);}
  await touch('touchEnd',[]);await pause(900);const mobileMoved=await capture('mobile-drag');
  await pause(500);const mobileHeld=await capture('mobile-held');
  const movement=await difference(mobileNeutral,mobileMoved),held=await difference(mobileMoved,mobileHeld);
  if(movement<.3||held>.1)throw new Error(`Touch camera movement/hold failed: ${movement}/${held}`);
  if(await evaluate('scrollY > 0'))throw new Error('Portrait drag scrolled page');
  await touch('touchStart',[[mx,my]]);await touch('touchEnd',[]);await pause(900);const mobileReset=await capture('mobile-reset');
  const resetDifference=await difference(mobileNeutral,mobileReset);
  if(resetDifference>.5)throw new Error(`Tap reset differs: ${resetDifference}`);
  await evaluate('document.querySelector("splat-portrait").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}))');
  await pause(900);await evaluate('document.querySelector("#recenter").click()');await pause(900);
  const buttonReset=await capture('mobile-button-reset');
  if(await difference(mobileNeutral,buttonReset)>.5)throw new Error('Recenter button failed');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await capture('mobile-reduced');
  if(!await evaluate('getComputedStyle(document.querySelector("splat-portrait canvas")).display === "none" && getComputedStyle(document.querySelector("splat-portrait img")).opacity === "1"'))throw new Error('Reduced-motion poster missing');
  for(const [width,height] of [[320,740],[768,1024]]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
    await pause(250);
    if(await evaluate('document.documentElement.scrollWidth > innerWidth'))throw new Error(`Overflow at ${width}`);
    await capture(`layout-${width}`);
  }
  await cdp('Emulation.setEmulatedMedia',{features:[]});
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs',{urls:['*/splats/color-sharp/portrait.spz*']});
  await cdp('Page.navigate',{url:origin+'/splat/color/'});
  let fallback=false;
  for(let i=0;i<100;i++){
    fallback=await evaluate('document.querySelector("splat-portrait")?.dataset.state === "unavailable"');
    if(fallback)break;
    await pause(100);
  }
  if(!fallback||!await evaluate('document.querySelector("splat-portrait img").naturalWidth > 0 && getComputedStyle(document.querySelector("splat-portrait img")).opacity === "1"'))throw new Error('Failed-load poster missing');
  await capture('failed-load');
  await cdp('Network.setBlockedURLs',{urls:[]});
  if(exceptions.length)throw new Error(JSON.stringify(exceptions));
  console.log({desktop:box,mobile,movement,held,resetDifference,exceptions:exceptions.length,poster:'public/splats/color-sharp/portrait-poster.webp'});
}finally{ws.close();}
