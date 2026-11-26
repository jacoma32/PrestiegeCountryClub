import {clubModel,heelSocket,setClubFinish} from './club-model.js?v=proshop1';
import * as T from 'three';

// A divided cart bag, with the tallest clubs in the rear row.
export const bagSections=[
 ['Drivers',['driver']],['Fairway woods',['wood']],['Hybrids',['hybrid']],
 ['Irons',['iron3','iron4','iron5','iron6','iron7','iron8','iron9']],
 ['Wedges',['pitching','approach','wedge','lob']],['Putters',['putter']]
];

export function buildBag(){
 const bag=new T.Group(),heads=[];
 const leather=new T.MeshStandardMaterial({color:0x202824,roughness:.72});
 const trim=new T.MeshStandardMaterial({color:0x3c4541,roughness:.82});
 const steel=new T.MeshStandardMaterial({color:0xc7d0d1,metalness:.52,roughness:.29});
 function mesh(geometry,material,x,y,z){
  const part=new T.Mesh(geometry,material);part.position.set(x,y,z);part.castShadow=true;bag.add(part);return part;
 }
 function band(y,r){
  const ring=mesh(new T.TorusGeometry(r,.016,8,36),trim,0,y,0);
  ring.rotation.x=Math.PI/2;ring.scale.y=.78;
 }
 const shell=mesh(new T.CylinderGeometry(.247,.192,.83,36),leather,0,.435,0);shell.scale.z=.78;
 for(const [y,r] of [[.05,.195],[.49,.225],[.84,.247]])band(y,r);
 const pocket=mesh(new T.SphereGeometry(1,20,14),trim,0,.34,.15);pocket.scale.set(.155,.265,.085);
 for(const x of [-.095,.095])mesh(new T.BoxGeometry(.012,.015,.34),trim,x,.855,0);
 mesh(new T.BoxGeometry(.43,.015,.012),trim,0,.855,0);
 const clubs=bagSections.flatMap(([,ids])=>ids);
 clubs.forEach((id,i)=>{
  const row=Math.floor(i/4),col=i%4,x=(col-1.5)*.095,z=(row-1.5)*.067;
  const wood=i<3,top=1.22-row*.081+(col%2)*.009+(wood?.08:0);
  const shaft=mesh(new T.CylinderGeometry(.004,.005,top-.84,8),steel,x,(top+.84)/2,z);
  shaft.rotation.z=-x*.34;
  const head=clubModel(id);bag.add(head);
  head.scale.setScalar(.81);head.position.set(x+.028,top,z);
  head.rotation.set(Math.PI-.35,wood?.18:row%2===0?-.34:.38,-.12);
  const neck=heelSocket(id).multiplyScalar(.81).applyQuaternion(head.quaternion).add(head.position);
  const foot=new T.Vector3(x,.825,z),axis=neck.clone().sub(foot);
  shaft.scale.y=axis.length()/(top-.84);shaft.position.copy(foot).lerp(neck,.5);
  shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
  head.userData.club=id;head.userData.shaft=shaft;head.userData.restY=top;head.userData.shaftY=shaft.position.y;heads.push(head);
 });
 const zipper=mesh(new T.BoxGeometry(.018,.36,.018),steel,.035,.38,.231);
 zipper.rotation.z=-.23;
 mesh(new T.BoxGeometry(.033,.055,.025),steel,.073,.54,.232);
 const handle=mesh(new T.TorusGeometry(.078,.017,10,22,Math.PI),trim,0,.676,.187);
 handle.scale.y=.81;
 for(const x of [-.12,.12]){
  const piping=mesh(new T.CylinderGeometry(.009,.009,.64,10),trim,x,.45,.141);
  piping.rotation.z=-x*.26;
 }
 bag.visible=false;return {bag,heads,setFinish(item,clubs){
  leather.color.set(item.color);trim.color.set(item.trim);
  steel.color.set(clubs.color||'#c7d0d1');
  heads.forEach(head=>setClubFinish(head,clubs));
 }};
}
