// Native SHARP Gaussians, recolored from their source camera. No depth-grid samples.
// node scripts/prepare-art-portrait.mjs input.ply color-source.jpg output-dir [full|portrait]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';
import { SpzWriter } from '@sparkjsdev/spark';
import sharp from 'sharp';

const [input, source, output, mode = 'portrait'] = process.argv.slice(2);
if (!input || !source || !output || !['full', 'portrait'].includes(mode)) throw new Error('Expected native PLY, matching color source, output directory, full|portrait');
const reference = 'src/assets/resources/wubba-lubba-dub-dub.jpg';
const bytes = await readFile(input);
const marker = Buffer.from('end_header\n');
const end = bytes.indexOf(marker) + marker.length;
if (end < marker.length) throw new Error('Invalid PLY header');
const header = bytes.subarray(0, end).toString();
if (!header.includes('format binary_little_endian 1.0')) throw new Error('Expected binary little-endian PLY');
const sizes = {float:4, uint:4, int:4, uchar:1};
const elements = [];
for (const line of header.trim().split('\n')) {
  const words = line.split(' ');
  if (words[0] === 'element') elements.push({name: words[1], count: Number(words[2]), properties: []});
  if (words[0] === 'property') elements.at(-1).properties.push({type: words[1], name: words[2]});
}
let offset = end;
for (const element of elements) {
  element.offset = offset;
  element.stride = element.properties.reduce((n, prop) => {
    if (!sizes[prop.type]) throw new Error(`Unsupported ${prop.type}`);
    prop.offset = n;
    return n + sizes[prop.type];
  }, 0);
  offset += element.count * element.stride;
}
if (offset !== bytes.length) throw new Error('PLY length mismatch');
const vertices = elements.find(e => e.name === 'vertex');
const props = Object.fromEntries(vertices.properties.map(p => [p.name, p.offset]));
for (const name of ['x','y','z','opacity','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3']) if (!(name in props)) throw new Error(`Missing ${name}`);
const get = (i, key) => bytes.readFloatLE(vertices.offset + i * vertices.stride + props[key]);
function metadata(name) {
  const e = elements.find(e => e.name === name);
  if (!e) throw new Error(`Missing ${name}`);
  return Array.from({length:e.count}, (_,i) => e.properties[0].type === 'uint'
    ? bytes.readUInt32LE(e.offset + i * e.stride) : bytes.readFloatLE(e.offset + i * e.stride));
}
const [width, height] = metadata('image_size');
const [focalLength] = metadata('intrinsic');
const sourceBytes = await readFile(source);
const {data:pixels, info} = await sharp(sourceBytes).rotate().greyscale().sharpen({sigma:.8,m1:1,m2:2}).raw().toBuffer({resolveWithObject:true});
if (info.width !== width || info.height !== height) throw new Error('Source image does not match the reconstruction camera');

// Tone transfer, not face transfer: compare corresponding face regions only.
// Their different expressions must never be warped onto one another.
const quantiles = [0, .02, .1, .25, .5, .75, .9, .98, 1];
async function distribution(path, region) {
  const values = [...await sharp(path).rotate().extract(region).greyscale().raw().toBuffer()].sort((a,b)=>a-b);
  return quantiles.map(q=>values[Math.min(values.length-1, Math.floor(q*values.length))]);
}
const sourceKnots = await distribution(source,{left:345,top:310,width:330,height:430});
const referenceKnots = await distribution(reference,{left:350,top:500,width:720,height:820});
const lut = Array.from({length:256}, (_,v) => {
  let k=1; while(k<sourceKnots.length-1 && v>sourceKnots[k]) k++;
  const t=(v-sourceKnots[k-1])/Math.max(1,sourceKnots[k]-sourceKnots[k-1]);
  const matched=referenceKnots[k-1]+t*(referenceKnots[k]-referenceKnots[k-1]);
  // Keep a little of the source curve to avoid flattening its highlight detail.
  const shadowT=Math.max(0,Math.min(1,(v-50)/110));
  const shadowContrast=18*(1-shadowT*shadowT*(3-2*shadowT));
  return Math.max(0,Math.min(255, .88*matched + .12*v-shadowContrast))/255;
});
const project = i => {
  const z=get(i,'z');
  return [get(i,'x')/z*focalLength+width/2,get(i,'y')/z*focalLength+height/2,z];
};
const faceDepths=[];
for(let i=0;i<vertices.count;i++) {
  const [x,y,z]=project(i);
  if(z>0 && Number.isFinite(z) && x>width*.42 && x<width*.61 && y>height*.34 && y<height*.53 && get(i,'opacity')>0) faceDepths.push(z);
}
faceDepths.sort((a,b)=>a-b);
if(!faceDepths.length) throw new Error('No opaque face Gaussians');
const focusDistance=faceDepths[Math.floor(faceDepths.length*.4)];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const selected=[];
for(let i=0;i<vertices.count;i++) {
  const [x,y,z]=project(i);
  let alpha=1/(1+Math.exp(-get(i,'opacity')));
  if(!Number.isFinite(z)||z<=0||x<0||y<0||x>=width||y>=height) continue;
  if(mode==='portrait') {
    // Isolate the native foreground by distance; no replacement geometry.
    alpha*=1-smooth(focusDistance*1.4,focusDistance*1.8,z);
    // Dissolve the lower shirt gently before the photograph's hard boundary.
    alpha*=1-smooth(.82,.96,y/height);
    alpha*=smooth(0,.065,x/width)*(1-smooth(.935,1,x/width));
  }
  if(alpha>1/1024) selected.push([i,x,y,alpha]);
}
const writer=new SpzWriter({numSplats:selected.length,shDegree:0,fractionalBits:18,flagAntiAlias:false});
for(let j=0;j<selected.length;j++) {
  const [i,x,y,alpha]=selected[j];
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,width-1),y1=Math.min(y0+1,height-1);
  const dx=x-x0,dy=y-y0;
  const l=lut[pixels[y0*width+x0]]*(1-dx)*(1-dy)+lut[pixels[y0*width+x1]]*dx*(1-dy)+lut[pixels[y1*width+x0]]*(1-dx)*dy+lut[pixels[y1*width+x1]]*dx*dy;
  writer.setCenter(j,get(i,'x'),get(i,'y'),get(i,'z'));
  writer.setQuat(j,get(i,'rot_1'),get(i,'rot_2'),get(i,'rot_3'),get(i,'rot_0'));
  writer.setScale(j,...[0,1,2].map(axis=>Math.exp(get(i,`scale_${axis}`))));
  writer.setAlpha(j,alpha);
  writer.setRgb(j,l,l,l);
}
if(writer.clippedCount) throw new Error('Quantization clipped native geometry');
const spz=await writer.finalize();
const camera={
  model:'SHARP', representation:'splats', width,height,focalLength,
  verticalFov:2*Math.atan(height/(2*focalLength))*180/Math.PI,
  focusDistance,defaultAngle:6,neutralYaw:mode==='portrait'?-4:0,splatCount:selected.length,nativeSplatCount:vertices.count,bytes:spz.length,
  source:'https://github.com/apple-aiml-research/ml-sharp',sourceRevision:'aed6527499ef91cba3b54c18d49a870f25947190',
  sourceImage:basename(source),sourceImageSha256:createHash('sha256').update(sourceBytes).digest('hex'),
  inputSha256:createHash('sha256').update(bytes).digest('hex'),
  reconstruction:'Native SHARP predicted means, rotations, scales, and opacities; not sampled monocular depth',
  appearance:'Grayscale source photograph reprojected through the source camera, tone-matched to the original B/W portrait',
  toneTransfer:{reference,quantiles,sourceKnots,referenceKnots,strength:.88,shadowContrast:18,sourceSharpen:{sigma:.8,m1:1,m2:2}},
  isolation:mode==='portrait'?'Native distance matte plus lower-shirt and outer-edge opacity feathering':'Full native scene',
  isolationParameters:mode==='portrait'?{depth:[1.4,1.8],bottom:[.82,.96],side:.065}:null,
};
await mkdir(output,{recursive:true});
await writeFile(join(output,'portrait.spz'),spz);
await writeFile(join(output,'portrait-camera.json'),JSON.stringify(camera,null,2)+'\n');
console.log(camera);
