import * as T from 'three';

let geometry;
function dimpledSphere(){
 const sphere=new T.SphereGeometry(1,144,112);
 const positions=sphere.getAttribute('position');
 const centers=Array.from({length:336},(_,i)=>{
  const y=1-2*(i+.5)/336, radius=Math.sqrt(1-y*y);
  const angle=i*Math.PI*(3-Math.sqrt(5));
  return new T.Vector3(radius*Math.cos(angle),y,radius*Math.sin(angle));
 });
 const vertex=new T.Vector3();
 for(let i=0;i<positions.count;i++){
  vertex.fromBufferAttribute(positions,i);
  let closest=.9961;
  for(const center of centers)closest=Math.max(closest,vertex.dot(center));
  const depth=(closest-.9961)/(1-.9961);
  vertex.multiplyScalar(1-.022*depth*depth*(3-2*depth));
  positions.setXYZ(i,vertex.x,vertex.y,vertex.z);
 }
 sphere.computeVertexNormals();
 // The sphere duplicates vertices along its UV seam. Smooth both sides together.
 const normals=sphere.getAttribute('normal'),other=new T.Vector3();
 for(let row=1;row<112;row++){
  const first=row*145,last=first+144;
  vertex.fromBufferAttribute(normals,first).add(other.fromBufferAttribute(normals,last)).normalize();
  for(const i of [first,last])normals.setXYZ(i,vertex.x,vertex.y,vertex.z);
 }
 for(let i=0;i<=144;i++){
  normals.setXYZ(i,0,1,0);
  normals.setXYZ(112*145+i,0,-1,0);
 }
 return sphere;
}

export function makeGolfBall(color){
 return new T.Mesh(geometry??=dimpledSphere(),new T.MeshStandardMaterial({color,roughness:.38}));
}

const markings=new Map();
export function setBallFinish(ball,item){
 ball.material.color.set(item.color);
 let map=null;
 if(item.brand){
  if(!markings.has(item.id)){
   const canvas=document.createElement('canvas');
   canvas.width=1024;canvas.height=512;
   const ink=canvas.getContext('2d');
   ink.fillStyle='#fff';ink.fillRect(0,0,1024,512);
   ink.fillStyle='#161c23';ink.textAlign='center';
   for(const x of [188,700]){
    ink.font='bold 31px Arial';ink.fillText(item.brand,x,241,125);
    ink.font='21px Arial';ink.fillText(item.name,x,268,125);
    ink.fillStyle='#9c2632';ink.fillText('1',x,293);ink.fillStyle='#161c23';
   }
   map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
   markings.set(item.id,map);
  }else map=markings.get(item.id);
 }
 if(ball.material.map!==map){
  ball.material.map=map;ball.material.needsUpdate=true;
 }
}
