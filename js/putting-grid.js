import * as THREE from 'three';

export function makePuttingGrid(world){
 const {x,z,rx,rz}=world.green;
 const lines=[],arrows=[];
 const mark=(vertices,ax,az,bx,bz)=>{
  if(!world.insideGreen(ax,az,0)||!world.insideGreen(bx,bz,0))return;
  vertices.push(ax,world.groundHeight(ax,az)+.071,az,bx,world.groundHeight(bx,bz)+.071,bz);
 };
 for(let u=-Math.ceil(rx*1.15);u<=rx*1.15;u++){
  for(let v=-Math.ceil(rz*1.15);v<=rz*1.15;v++){
   const px=x+u,pz=z+v;
   for(let step=0;step<4;step++){
    const t=step/4;
    mark(lines,px+t,pz,px+t+.25,pz);
    mark(lines,px,pz+t,px,pz+t+.25);
   }
   if(u%2||v%2)continue;
   const dx=world.groundHeight(px-.25,pz)-world.groundHeight(px+.25,pz);
   const dz=world.groundHeight(px,pz-.25)-world.groundHeight(px,pz+.25);
   const slope=Math.hypot(dx,dz);
   if(slope<.007)continue;
   const length=Math.min(.62,.32+slope*3);
   const vx=dx/slope,vz=dz/slope,tx=px+vx*length,tz=pz+vz*length;
   mark(arrows,px,pz,tx,tz);
   mark(arrows,tx,tz,tx-.17*vx+.10*vz,tz-.17*vz-.10*vx);
   mark(arrows,tx,tz,tx-.17*vx-.10*vz,tz-.17*vz+.10*vx);
  }
 }
 const group=new THREE.Group();
 for(const [positions,color,opacity] of [[lines,0xf0ffe2,.28],[arrows,0xffe1a0,.73]]){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const material=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false});
  group.add(new THREE.LineSegments(geometry,material));
 }
 group.visible=false;
 return group;
}
