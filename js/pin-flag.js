import * as THREE from 'three';

let flagCrest;

export function pinFlagMaterial(clock){
 const flagMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
 if(!flagCrest){
  flagCrest=new THREE.TextureLoader().load(new URL('../assets/prestige-crest.webp',import.meta.url).href);
  flagCrest.colorSpace=THREE.SRGBColorSpace;
 }
 flagMaterial.side=THREE.DoubleSide;
 flagMaterial.map=flagCrest;
 flagMaterial.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   // Keep the square crest centered on the cloth and readable from both sides.
   vec2 crestUv=(vMapUv-.5)/vec2(.43,.855)+.5;
   if(!gl_FrontFacing)crestUv.x=1.-crestUv.x;
   if(all(greaterThanEqual(crestUv,vec2(0.)))&&all(lessThanEqual(crestUv,vec2(1.)))){
    vec4 crest=texture2D(map,crestUv);
    diffuseColor.rgb=mix(diffuseColor.rgb,crest.rgb,crest.a);
   }
  `);
  if(!clock)return;
  shader.uniforms.flagTime=clock;
  shader.vertexShader='uniform float flagTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float sail=uv.x;transformed.z+=sail*(.18*sin(8.*sail-4.*flagTime)+.065*sin(17.*sail-5.3*flagTime+uv.y));transformed.y-=.17*sail*sail;`);
 };
 flagMaterial.customProgramCacheKey=()=>clock?'pcc-pin-waving':'pcc-pin-static';
 return flagMaterial;
}
