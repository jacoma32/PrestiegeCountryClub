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
