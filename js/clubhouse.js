import * as T from 'three';
import {Golfer} from './actors.js?v=clubs1';

const guestPositions=[[.85,-1.35],[-.88,-1.35],[1.82,-2.7]];

export class Clubhouse {
 constructor(local,stage,finish){
  this.local=local;this.stage=stage;this.finish=finish;
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(33,1,.1,30);
  this.scene.add(new T.HemisphereLight(0xfff6df,0x68766c,2));
  const key=new T.DirectionalLight(0xffefcc,2.5);key.position.set(-2,4,4);this.scene.add(key);
  const rim=new T.DirectionalLight(0xf2dbab,2);rim.position.set(2,2,-2);this.scene.add(rim);
  this.members=new Map();
  this.pads=[[0,0],...guestPositions].map(([x,z],index)=>{
   const mat=new T.MeshStandardMaterial({color:index?0x31483b:0x456144,roughness:.83});
   const plinth=new T.Mesh(new T.CylinderGeometry(.65,.67,.065,80),mat);
   plinth.position.set(x,-.04,z);this.scene.add(plinth);
   const band=new T.Mesh(new T.TorusGeometry(.635,.006,8,80),new T.MeshBasicMaterial({color:0xc4b282}));
   band.rotation.x=Math.PI/2;plinth.add(band);band.position.y=.033;
   plinth.visible=index===0;
   return plinth;
  });
 }
 enter(){
  this.scene.add(this.local.root);this.local.stanceGround=null;this.local.setVisible(true);
  this.local.club.visible=false;this.local.root.position.set(0,0,0);this.local.root.rotation.set(0,-.13,0);
  this.local.animate('idle',true);
 }
 setMembers(profiles,onError){
  for(const [id,entry] of this.members){
   if(!profiles[id]||JSON.stringify(profiles[id])!==entry.key){
    entry.actor?.root.removeFromParent();
    entry.tag.remove();
    this.members.delete(id);
   }
  }
  for(const [id,profile] of Object.entries(profiles)){
   if(this.members.has(id))continue;
   const tag=document.createElement('div');
   tag.className='golfer-tag guest-tag';
   tag.textContent='@'+profile.name;
   this.stage.append(tag);
   const entry={key:JSON.stringify(profile),tag,actor:null};
   this.members.set(id,entry);
   this.loadMember(id,profile,entry).catch(onError);
  }
  this.layout();
 }
 async loadMember(id,profile,entry){
  const actor=new Golfer(new T.Group());
  await actor.load(profile.frame);await actor.loadAllAnimations(['idle']);
  if(this.members.get(id)!==entry)return;
  actor.applyAppearance(profile.colors);this.finish(actor,profile.pattern,profile.hat,profile.clubs);
  entry.actor=actor;
  if(!this.onCourse)this.layout();
 }
 layout(){
  this.pads.slice(1).forEach((pad,index)=>{pad.visible=index<this.members.size});
  if(this.onCourse)return;
  let index=0;
  for(const entry of this.members.values()){
   const [x,z]=guestPositions[index++];
   if(!entry.actor)continue;
   const actor=entry.actor;
   this.scene.add(actor.root);
   actor.root.visible=true;actor.root.position.set(x,0,z);actor.root.rotation.set(0,-.22,0);
   actor.club.visible=false;actor.animate('idle',true);
  }
 }
 beginRound(){this.onCourse=true;this.hideMembers()}
 hideMembers(){for(const {actor} of this.members.values())if(actor)actor.root.visible=false}
 endRound(){this.onCourse=false;this.layout()}
 actor(id){return this.members.get(id)?.actor}
 draw(renderer,dt){
  const idle=this.local.actions.get('idle');
  this.local.root.visible=!!idle;
  if(idle&&!idle.isRunning())this.local.animate('idle',true);
  this.local.update(dt);
  for(const {actor} of this.members.values())actor?.update(dt);
  const w=this.stage.clientWidth,h=this.stage.clientHeight;if(!w||!h)return;
  const cam=this.camera;cam.aspect=w/h;cam.updateProjectionMatrix();
  const center=this.members.size===3?.42:0;
  cam.position.set(center,1.12,Math.max(this.members.size>1?5.4:4.5,(this.members.size>1?4.2:2.62)/cam.aspect));
  cam.lookAt(center,.82,0);cam.updateMatrixWorld();
  const tags=[[document.getElementById('localTag'),0,.18]];
  let index=0;
  for(const {tag} of this.members.values()){
   const [x,z]=guestPositions[index++];
   tags.push([tag,x,z+.15]);
  }
  for(const [tag,x,z] of tags){
   const p=new T.Vector3(x,-.06,z).project(cam);
   tag.style.left=(50+50*p.x)+'%';tag.style.top=(50-50*p.y)+'%';
  }
  renderer.render(this.scene,cam);
 }
}
