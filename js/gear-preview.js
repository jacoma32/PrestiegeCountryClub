import * as T from 'three';
import {makeGolfBall,setBallFinish} from './golf-ball.js?v=brands1';
import {buildBag} from './golf-bag.js?v=brands1';
import {clubModel,makeShaft,setClubFinish} from './club-model.js?v=proshop1';
import {itemById} from './locker.js?v=brands1';

const images=new Map();
const garments=new Map();
let studio;

function getStudio(){
 if(studio)return studio;
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
 renderer.setSize(360,240);
 renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene();
 scene.add(new T.HemisphereLight(0xfff9ec,0x788da4,1.9));
 for(const [color,strength,position] of [[0xffedda,3,[-3,5,4]],[0xc3deff,2,[3,2,-3]]]){
  const light=new T.DirectionalLight(color,strength);
  light.position.set(...position);scene.add(light);
 }
 return studio={renderer,scene,camera:new T.PerspectiveCamera(28,1.5,.01,30)};
}

function garment(actor,slot,frame){
 const key=frame+':'+slot;
 if(garments.has(key))return garments.get(key);
 const source=actor.outfit?.mesh?.geometry;
 if(!source)return;
 const group=source.groups.find(group=>group.materialIndex===(slot==='hat'?7:1));
 const geometry=new T.BufferGeometry();
 for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
  const input=source.getAttribute(name),values=[];
  for(let i=group.start;i<group.start+group.count;i++){
   const offset=source.index.getX(i)*size;
   for(let j=0;j<size;j++)values.push(input.array[offset+j]);
  }
  geometry.setAttribute(name,new T.Float32BufferAttribute(values,size));
 }
 geometry.center();
 const material=new T.MeshStandardMaterial({map:slot==='shirt'?actor.outfit.shirt.map:null,roughness:.86,side:T.DoubleSide});
 const mesh=new T.Mesh(geometry,material);garments.set(key,mesh);
 return mesh;
}

let displayBag;
let displaySet;
function clubDisplay(){
 const group=new T.Group();
 for(const [i,id] of ['driver','iron7','wedge','putter'].entries()){
  const club=new T.Group(),head=clubModel(id);
  head.position.y=-1;club.add(head,makeShaft());
  club.position.set((i-1.5)*.19,.55-i*.055,0);
  club.rotation.set(.06,.32,-.18+i*.1);group.add(club);
 }
 return group;
}

export function gearImage(item,actor,shirtColor,frame,finishShirt){
 const clothing=item.slot==='shirt'||item.slot==='hat';
 const color=item.color||shirtColor;
 const key=clothing?item.id+':'+frame+':'+color:item.id;
 if(images.has(key))return images.get(key);
 let model;
 switch(item.slot){
  case 'shirt':
  case 'hat':
   model=garment(actor,item.slot,frame);
   if(!model)return;
   model.material.color.set(color);
   if(item.slot==='shirt')finishShirt({outfit:{shirt:model.material}},item.id);
   break;
  case 'ball':
   model=makeGolfBall(color);setBallFinish(model,item);
   break;
  case 'bag':
   displayBag??=buildBag();
   displayBag.setFinish(item,itemById('club-set'));
   model=displayBag.bag;model.visible=true;
   break;
  case 'clubs':
   model=displaySet??=clubDisplay();
   setClubFinish(model,item);
   break;
 }
 const {renderer,scene,camera}=getStudio();
 const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3());
 const size=box.getSize(new T.Vector3());
 const height=Math.max(size.y,size.x/1.5,size.z*.8);
 const angle=item.slot==='shirt'?.16:.52;
 const distance=height*2.65;
 camera.position.copy(center).add(new T.Vector3(angle,.22,1).normalize().multiplyScalar(distance));
 camera.lookAt(center);
 scene.add(model);renderer.render(scene,camera);model.removeFromParent();
 const image=renderer.domElement.toDataURL('image/webp',.9);
 if(item.slot==='ball')model.material.dispose();
 if(images.size>=100)images.delete(images.keys().next().value);
 images.set(key,image);
 return image;
}
