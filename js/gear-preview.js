import {setHatFinish} from './gear-logos.js';
import * as T from 'three';
import {makeGolfBall,setBallFinish} from './golf-ball.js?v=equipment1';
import {buildBag} from './golf-bag.js?v=clubs1';
import {clubModel,heelSocket,makeShaft,setClubFinish} from './club-model.js?v=equipment1';

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
 const material=new T.MeshStandardMaterial({map:slot==='shirt'?actor.outfit.shirt.map:null,roughness:.86,side:T.DoubleSide});
 const mesh=new T.Mesh(geometry,material);garments.set(key,mesh);
 return mesh;
}

let displayBag;
let displaySet;
const individualClubs=new Map();
function previewClub(type,length,lean=0,down=false){
 const club=new T.Group(),head=clubModel(type),shaft=makeShaft();
 head.rotation.set(-.16,2.55,-.12);
 const socket=heelSocket(type).applyQuaternion(head.quaternion);
 const axis=new T.Vector3(lean,down?-1:1,0).normalize();
 shaft.position.copy(socket).addScaledVector(axis,length);
 shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);
 shaft.scale.y=length;
 club.add(head,shaft);
 return club;
}

function clubDisplay(){
 const group=new T.Group();
 for(const [i,id] of ['driver','iron7','wedge','putter'].entries()){
  const club=previewClub(id,[1.12,.93,.88,.86][i]);
  club.position.set((i-1.5)*.19,0,0);
  club.rotation.z=.16-i*.10;group.add(club);
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
   else setHatFinish(model.material,item);
   break;
  case 'ball':
   model=makeGolfBall(color);setBallFinish(model,item);
   model.rotation.y=Math.PI*.84;
   break;
  case 'bag':
   displayBag??=buildBag();
   displayBag.setFinish(item,{clubs:'club-set'});
   model=displayBag.bag;model.visible=true;
   break;
  case 'clubs':
   model=displaySet??=clubDisplay();
   setClubFinish(model,item);
   break;
  default: {
   const type=item.blade?'blade':item.slot==='wedges'?'wedge':item.slot==='irons'?'iron7':item.slot;
   if(!individualClubs.has(type)){
    const down=type!=='putter'&&type!=='blade';
    individualClubs.set(type,previewClub(type,.105,.32,down));
   }
   model=individualClubs.get(type);
   setClubFinish(model,item);
  }
 }
 const {renderer,scene,camera}=getStudio();
 const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3());
 const size=box.getSize(new T.Vector3());
 const height=Math.max(size.y,size.x/1.5,size.z*.8);
 const angle=item.slot==='shirt'?.16:item.slot==='ball'?0:.52;
 const distance=height*2.65;
 camera.position.copy(center).add(new T.Vector3(angle,.22,1).normalize().multiplyScalar(distance));
 camera.lookAt(center);
 scene.add(model);renderer.render(scene,camera);model.removeFromParent();
 let image=renderer.domElement.toDataURL('image/webp',.9);
 if(item.slot==='ball'){
  const canvas=document.createElement('canvas');
  canvas.width=360;canvas.height=240;
  const context=canvas.getContext('2d');
  context.fillStyle='#f3f0e8';context.fillRect(0,0,360,240);
  context.drawImage(renderer.domElement,112,0,248,240);
  context.fillStyle='#192b22';context.font='bold 17px Arial';
  context.fillText(item.brand||'Prestige',16,100,125);
  context.font='14px Arial';context.fillText(item.name,16,123,125);
  context.font='11px Arial';context.fillText('GOLF BALL',16,146);
  image=canvas.toDataURL('image/webp',.9);
 }
 if(item.slot==='ball')model.material.dispose();
 if(images.size>=100)images.delete(images.keys().next().value);
 images.set(key,image);
 return image;
}
