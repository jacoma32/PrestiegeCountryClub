import {setBallFinish} from './golf-ball.js?v=brands1';
import {itemById,clubLoadout} from './locker.js?v=clubs1';

// One ordered data channel carries the active player's camera, pose and hole result.
const $=id=>document.getElementById(id);
const COURSE_HOLES=18;
const validScore=n=>Number.isInteger(n)&&n>0&&n<10000;
const pose=o=>[...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()];
function applyPose(o,p){
 if(!Array.isArray(p)||p.length!==10||!p.every(Number.isFinite))return;
 o.position.fromArray(p);o.quaternion.fromArray(p,3);o.scale.fromArray(p,7);
}

export class Match {
 constructor(game,room,lobby){
  Object.assign(this,{game,room,lobby});this.ballColor=game.ball.material.color.getHex();
  this.hole=0;this.turn='host';this.points={host:0,guest:0};this.card={};this.lastSend=0;
 }
 start(){
  this.ready=true;this.playTurn(false);
  for(const message of this.pending||[])this.receive(message);
  this.pending=[];
 }
 playTurn(reset){
  const g=this.game,watch=this.turn!==this.room.role;
  const localBall=itemById(g.equipment?.ball);
  if(localBall)setBallFinish(g.ball,localBall);else g.ball.material.color.setHex(this.ballColor);
  if(reset)g.startHole(this.hole);
  if(!watch&&g.equipment){
   g.setBagFinish(itemById(g.equipment.bag),g.equipment);
   this.watchedBag=null;
  }
  g.spectating=watch;g.modal=false;
  $('roundModal').classList.add('hidden');$('nextHole').hidden=true;
  g.golfer.root.visible=!watch;g.ball.visible=!watch;
  if(watch){g.bag.visible=false;g.shotPreview.group.visible=false;g.contactShadow.visible=false}
  $('rivalScore').textContent=(watch?'WATCHING @'+this.room.remoteName:'YOUR TURN')+' · HOLE '+(this.hole+1)+' OF '+COURSE_HOLES+' · '+this.standings();
  document.body.classList.toggle('watching-golf',watch);
  if(this.lobby.remote)this.lobby.remote.root.visible=false;
  this.frame=null;this.lastSend=0;
  if(!watch)g.refresh();
 }
 snapshot(){
  const g=this.game,a=g.golfer;
  return {kind:'frame',camera:pose(g.camera),root:pose(a.root),model:pose(a.model),
   bones:Array.from(a.basePose.keys(),b=>b.quaternion.toArray()),club:g.club,
   stick:pose(a.club),head:pose(a.clubHead),held:a.club.visible,
   bag:g.bag.visible?{pose:pose(g.bag),style:g.equipment?.bag,clubs:g.equipment?.clubs,clubStyles:clubLoadout(g.equipment)}:null,
   tee:g.tee.visible,ball:g.ball.position.toArray(),ballStyle:g.equipment?.ball,color:g.ball.material.color.getHex(),visible:g.ball.visible,shots:g.shots};
 }
 send(data){this.room.send({...data,type:'state',hole:this.hole,turn:this.turn})}
 update(dt){
  const g=this.game;
  if(!this.ready)return;
  if(!g.spectating){
   if(!this.result)g.update(dt);
   if(!this.result&&performance.now()-this.lastSend>65){
    this.lastSend=performance.now();this.send(this.snapshot());
   }
   return;
  }
  g.world.waterClock.value+=dt;
  const f=this.frame;if(!f)return;
  const actor=this.lobby.remote;
  if(actor){
   if(actor.root.parent!==g.scene)g.scene.add(actor.root);
   actor.root.visible=true;applyPose(actor.root,f.root);applyPose(actor.model,f.model);
   let i=0;for(const b of actor.basePose.keys()){const q=f.bones[i++];if(q?.length===4)b.quaternion.fromArray(q)}
   if(actor.clubType!==f.club)actor.setClub(f.club);
   applyPose(actor.club,f.stick);applyPose(actor.clubHead,f.head);actor.fitShaft();actor.club.visible=f.held;
  }
  const blend=1-Math.exp(-dt*28);
  if(this.snap){applyPose(g.camera,f.camera);g.ball.position.fromArray(f.ball);this.snap=false}
  else{
   const target=g.camera.position.clone().fromArray(f.camera);
   g.camera.position.lerp(target,blend);
   g.camera.quaternion.slerp(g.camera.quaternion.clone().fromArray(f.camera,3),blend);
   g.ball.position.lerp(target.fromArray(f.ball),blend);
  }
  g.bag.visible=!!f.bag;
  if(f.bag){
   const bag=itemById(f.bag.style);
   const style=bag?.slot==='bag'?bag:itemById('club-bag');
   const set=clubLoadout({...f.bag.clubStyles,clubs:f.bag.clubs});
   const key=style.id+':'+JSON.stringify(set);
   if(this.watchedBag!==key){g.setBagFinish(style,set);this.watchedBag=key}
   applyPose(g.bag,f.bag.pose);g.showBagClubs(f.held?f.club:null);
  }
  g.tee.visible=f.tee;g.ball.visible=f.visible;
  const watchedBall=itemById(f.ballStyle);
  if(watchedBall?.slot==='ball')setBallFinish(g.ball,watchedBall);
  else{
   setBallFinish(g.ball,itemById('white'));
   g.ball.material.color.setHex(f.color);
  }
 }
 receive(m){
  if(!this.ready){(this.pending??=[]).push(m);return}
  if(m.hole!==this.hole||m.turn!==this.turn)return;
  if(m.kind==='next'&&this.room.role==='guest'&&this.result){this.advance();return}
  if(this.room.role===this.turn||this.result)return;
  if(m.kind==='finish'&&validScore(m.score)){this.finish(m.score);return}
  if(m.kind==='frame'&&m.camera?.length===10&&m.ball?.length===3&&Array.isArray(m.bones)){
   if(!this.frame)this.snap=true;
   this.frame=m;$('strokeLabel').textContent=String(m.shots+1);
  }
 }
 holed(score){
  if(this.room.role!==this.turn||this.result||!validScore(score))return;
  this.send({kind:'finish',score});this.finish(score);
 }
 finish(score){
  this.card[this.turn]=score;
  if(this.turn==='host'){
   this.turn='guest';this.playTurn(this.room.role==='guest');return;
  }
  this.result=true;const {host,guest}=this.card;
  const winner=host===guest?null:host<guest?'host':'guest';
  if(winner)this.points[winner]++;
  this.complete=this.hole+1===COURSE_HOLES;
  const title=(side,subject)=>side===null?subject+' TIED':side===this.room.role?'YOU WIN THE '+subject:'@'+this.room.remoteName+' WINS THE '+subject;
  const courseWinner=this.points.host===this.points.guest?null:this.points.host>this.points.guest?'host':'guest';
  $('roundEyebrow').textContent=this.complete?'COURSE COMPLETE · 18 OF 18':'HOLE '+(this.hole+1)+' OF 18 COMPLETE';
  $('roundTitle').textContent=this.complete?title(courseWinner,'COURSE'):title(winner,'HOLE');
  const local=this.card[this.room.role],other=this.card[this.room.role==='host'?'guest':'host'];
  $('roundDescription').textContent='Hole '+(this.hole+1)+' strokes · You '+local+' / @'+this.room.remoteName+' '+other;
  $('scorecard').textContent=this.standings()+(this.complete?'':' · Continuing to hole '+(this.hole+2));
  const next=$('nextHole');
  next.hidden=false;next.disabled=!this.complete&&this.room.role==='guest';
  next.textContent=this.complete?'RETURN TO CLUBHOUSE':this.room.role==='host'?'CONTINUE TO HOLE '+(this.hole+2):'NEXT TEE · HOLE '+(this.hole+2);
  $('toClubhouse').hidden=true;
  $('roundModal').classList.remove('hidden');
  if(!this.complete&&this.room.role==='host')this.timer=setTimeout(()=>this.nextHole(),4500);
 }
 standings(){
  const me=this.room.role,other=me==='host'?'guest':'host';
  return 'Holes won · You '+this.points[me]+' / @'+this.room.remoteName+' '+this.points[other];
 }
 nextHole(){
  if(!this.result||this.complete||this.room.role!=='host')return;
  this.send({kind:'next'});this.advance();
 }
 advance(){
  if(!this.result||this.complete)return;
  clearTimeout(this.timer);
  this.hole++;this.card={};this.result=false;this.turn='host';this.playTurn(true);
 }
 stop(){
  clearTimeout(this.timer);this.ready=false;this.game.spectating=false;this.game.ball.material.color.setHex(this.ballColor);
  const gear=this.game.equipment;
  if(gear){
   setBallFinish(this.game.ball,itemById(gear.ball));
   this.game.setBagFinish(itemById(gear.bag),gear);
  }
  document.body.classList.remove('watching-golf');$('nextHole').hidden=false;$('nextHole').disabled=false;$('toClubhouse').hidden=false;
  const actor=this.lobby.remote;
  if(actor){this.lobby.scene.add(actor.root);actor.root.visible=true;actor.root.position.set(.79,0,-.95);actor.root.rotation.set(0,-.22,0);actor.club.visible=false;actor.animate('idle',true)}
 }
}
