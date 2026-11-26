import * as T from 'three';
import {Golfer} from './actors.js?v=clubs1';

export class Clubhouse {
 constructor(local,stage,finish){
  this.local=local;this.stage=stage;this.finish=finish;
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(33,1,.1,30);
  this.scene.add(new T.HemisphereLight(0xfff6df,0x68766c,2));
  const key=new T.DirectionalLight(0xffefcc,2.5);key.position.set(-2,4,4);this.scene.add(key);
  const rim=new T.DirectionalLight(0xf2dbab,2);rim.position.set(2,2,-2);this.scene.add(rim);
  for(const [i,x,z] of [[0,0,0],[1,.79,-.95]]){
   const mat=new T.MeshStandardMaterial({color:i?0x31483b:0x456144,roughness:.83});
   const plinth=new T.Mesh(new T.CylinderGeometry(.65,.67,.065,80),mat);
   plinth.position.set(x,-.04,z);this.scene.add(plinth);
   const band=new T.Mesh(new T.TorusGeometry(.635,.006,8,80),new T.MeshBasicMaterial({color:0xc4b282}));
   band.rotation.x=Math.PI/2;plinth.add(band);band.position.y=.033;
   if(i)this.secondPad=plinth;
  }
  this.secondPad.visible=false;
 }
 enter(){
  this.scene.add(this.local.root);this.local.stanceGround=null;this.local.setVisible(true);
  this.local.club.visible=false;this.local.root.position.set(0,0,0);this.local.root.rotation.set(0,-.13,0);
  this.local.animate('idle',true);
 }
 async member(profile){
  const key=profile?JSON.stringify(profile):'';
  if(key===this.memberKey)return;this.memberKey=key;
  const previous=this.remote;this.remote=null;previous?.root.removeFromParent();
  const ticket=this.ticket=Symbol();this.secondPad.visible=!!profile;
  document.getElementById('guestTag').hidden=!profile;
  document.getElementById('guestTag').textContent=profile?'@'+profile.name:'';
  if(!profile)return;
  const remote=new Golfer(new T.Group());
  await remote.load(profile.frame);await remote.loadAllAnimations(['idle']);
  if(this.ticket!==ticket)return;
  remote.applyAppearance(profile.colors);this.finish(remote,profile.pattern,profile.hat,profile.clubs);
  remote.club.visible=false;remote.root.position.set(.79,0,-.95);remote.root.rotation.y=-.22;
  this.scene.add(remote.root);this.remote=remote;
 }
 draw(renderer,dt){
  const idle=this.local.actions.get('idle');
  this.local.root.visible=!!idle;
  if(idle&&!idle.isRunning())this.local.animate('idle',true);
  this.local.update(dt);this.remote?.update(dt);
  const w=this.stage.clientWidth,h=this.stage.clientHeight;if(!w||!h)return;
  const cam=this.camera;cam.aspect=w/h;cam.updateProjectionMatrix();
  const center=this.secondPad.visible?.28:0;
  cam.position.set(center,1.06,Math.max(4.5,2.62/cam.aspect));cam.lookAt(center,.82,0);cam.updateMatrixWorld();
  for(const [id,x,z] of [['localTag',0,.18],['guestTag',.79,-.8]]){
   const p=new T.Vector3(x,-.06,z).project(cam),tag=document.getElementById(id);
   tag.style.left=(50+50*p.x)+'%';tag.style.top=(50-50*p.y)+'%';
  }
  renderer.render(this.scene,cam);
 }
}
