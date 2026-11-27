import * as THREE from 'three';

export class SandBurst {
 constructor(scene){
  const grains=new THREE.IcosahedronGeometry(1,0);
  const material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false});
  this.mesh=new THREE.InstancedMesh(grains,material,40);
  this.mesh.visible=false;
  this.mesh.frustumCulled=false;
  this.pose=new THREE.Object3D();
  const color=new THREE.Color(),darkSand=new THREE.Color(0x9c754a),lightSand=new THREE.Color(0xe4c99b);
  for(let i=0;i<this.mesh.count;i++){
   this.mesh.setColorAt(i,color.lerpColors(darkSand,lightSand,i/(this.mesh.count-1)));
  }
  scene.add(this.mesh);
 }
 start(position,direction,power){
  this.mesh.position.copy(position);
  this.mesh.visible=true;
  this.age=0;
  const force=.65+.55*power;
  this.grains=Array.from({length:this.mesh.count},()=>{
   const angle=Math.random()*Math.PI*2;
   const spread=(.4+Math.random()*2.2)*force;
   return {
    x:direction.x*force*1.8+Math.cos(angle)*spread,
    z:direction.z*force*1.8+Math.sin(angle)*spread,
    lift:(1.3+Math.random()*2.6)*force,
    size:.017+Math.random()*.023,
   };
  });
  this.update(0);
 }
 update(dt){
  if(!this.mesh.visible)return;
  const t=this.age+=dt;
  if(t>.95){this.mesh.visible=false;return}
  this.mesh.material.opacity=Math.min(1,(.95-t)*3);
  this.grains.forEach(({x,z,lift,size},i)=>{
   const y=lift*t-4.9*t*t+.025;
   this.pose.position.set(x*t,Math.max(0,y),z*t);
   this.pose.scale.setScalar(y>0?size:0);
   this.pose.updateMatrix();
   this.mesh.setMatrixAt(i,this.pose.matrix);
  });
  this.mesh.instanceMatrix.needsUpdate=true;
 }
}
