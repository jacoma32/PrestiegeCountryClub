import * as T from 'three';

const marks=new Map();
export function gearLogo(brand,dark=false){
 const key=brand+':'+dark;
 if(marks.has(key))return marks.get(key);
 const canvas=document.createElement('canvas');
 canvas.width=512;canvas.height=160;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=dark?'#14212b':'#fff9ea';
 ctx.textAlign='center';ctx.textBaseline='middle';
 if(brand==='Nike'){
  ctx.beginPath();ctx.moveTo(106,77);
  ctx.bezierCurveTo(49,140,96,147,165,123);
  ctx.lineTo(417,38);
  ctx.lineTo(177,97);
  ctx.bezierCurveTo(132,107,111,112,106,77);
  ctx.fill();
 }else if(brand==='adidas'){
  for(const [i,height] of [29,51,74].entries()){
   const x=191+i*44;
   ctx.beginPath();ctx.moveTo(x,93);ctx.lineTo(x+43,93);
   ctx.lineTo(x+3,93-height);ctx.lineTo(x-35,109-height);ctx.closePath();ctx.fill();
  }
  ctx.font='bold 43px Arial';ctx.fillText('adidas',256,126);
 }else if(brand==='Callaway'){
  ctx.font='bold 76px Georgia';ctx.fillText('Callaway',256,66,448);
  ctx.beginPath();ctx.moveTo(207,109);ctx.lineTo(256,129);ctx.lineTo(305,109);
  ctx.lineTo(256,146);ctx.closePath();ctx.fill();
 }else{
  const style=brand==='Titleist'?'italic bold 103px cursive':brand==='TaylorMade'?'italic bold 80px Arial':'900 90px Arial';
  ctx.font=style;ctx.fillText(brand,256,86,470);
 }
 const map=new T.CanvasTexture(canvas);
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 marks.set(key,map);return map;
}

export function setHatFinish(material,item){
 material.color.set(item.color);
 if(material.userData.hatFinish===item.id)return;
 material.userData.hatFinish=item.id;
 const map=item.brand?gearLogo(item.brand,material.color.getHSL({}).l>.57):null;
 material.customProgramCacheKey=()=>map?'hat-embroidery':'plain-hat';
 material.onBeforeCompile=shader=>{
  if(!map)return;
  shader.uniforms.hatLogo={value:map};
  shader.vertexShader='varying vec3 capRestPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\n capRestPosition=position;');
  shader.fragmentShader='uniform sampler2D hatLogo; varying vec3 capRestPosition;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 logoUV=(capRestPosition.xy-vec2(0.0,1.789))/vec2(.164,.051)+.5;
   vec4 logo=texture2D(hatLogo,clamp(logoUV,0.,1.));
   float front=smoothstep(.025,.066,capRestPosition.z);
   diffuseColor.rgb=mix(diffuseColor.rgb,logo.rgb,logo.a*front);
  `);
 };
 material.needsUpdate=true;
}
