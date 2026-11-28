import {setBallFinish} from './golf-ball.js?v=brands1';
import {itemById,clubLoadout} from './locker.js?v=clubshop2';

// Golfers rotate after each stroke and advance to the next hole together.
const $=id=>document.getElementById(id);
const validScore=n=>Number.isInteger(n)&&n>0&&n<10000;
const pose=o=>[...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()];
function applyPose(o,p){
 if(!Array.isArray(p)||p.length!==10||!p.every(Number.isFinite))return;
 o.position.fromArray(p);o.quaternion.fromArray(p,3);o.scale.fromArray(p,7);
}

export class Match {
 constructor(game,room,lobby,length=18,order=room.playerIds,wind=[]){
  Object.assign(this,{game,room,lobby,length,order,wind});this.ballColor=game.ball.material.color.getHex();
  this.hole=0;this.turn=this.order[0];this.sequence=0;
  this.points=Object.fromEntries(this.order.map(id=>[id,0]));this.totals={...this.points};this.strokes={...this.points};this.card={};this.lastSend=0;
 }
 start(){
  this.ready=true;this.lobby.beginRound();this.playTurn(false);
  for(const message of this.pending||[])this.receive(message);
  this.pending=[];
 }
 playTurn(reset){
  const g=this.game,watch=this.turn!==this.room.id;
  const localBall=itemById(g.equipment?.ball);
  if(localBall)setBallFinish(g.ball,localBall);else g.ball.material.color.setHex(this.ballColor);
  if(reset)g.startHole(this.hole);
  if(reset||!this.own)this.saveLocalBall();
  const wind=this.wind[this.hole];
  if(Number.isFinite(wind))g.wind=(g.world.windStrength??0)*wind;
  if(!watch){
   g.position.copy(this.own.position);g.ball.position.copy(g.position);
   g.shots=this.own.shots;g.tee.visible=this.own.tee;
   g.charge=0;g.charging=false;g.swinging=false;g.orbit=0;
  }
  if(!watch&&g.equipment){
   g.setBagFinish(itemById(g.equipment.bag),g.equipment);
   this.watchedBag=null;
  }
  g.spectating=watch;g.modal=false;
  $('roundModal').classList.add('hidden');$('nextHole').hidden=true;
  g.golfer.root.visible=!watch;g.ball.visible=!watch;
  if(watch){g.bag.visible=false;g.shotPreview.group.visible=false;g.contactShadow.visible=false}
  $('rivalScore').textContent=(watch?'Watching '+this.name(this.turn):'Your turn')+' · Hole '+(this.hole+1)+' of '+this.length;
  this.renderScores();
  document.body.classList.toggle('watching-golf',watch);
  this.lobby.hideMembers();
  this.frame=null;this.lastSend=0;
  if(!watch){
   if(!g.placing)g.placeGolfer();
   g.moveCamera(0,true);g.refresh();
  }
 }
 saveLocalBall(){
  const g=this.game;
  this.own={position:g.position.clone(),shots:g.shots,tee:g.tee.visible};
 }
 renderScores(){
  const table=$('friendScores');
  const key=this.order.map(id=>[this.name(id),this.strokes[id],this.totals[id],Object.hasOwn(this.card,id)].join(':')).join('|')+this.turn+this.result;
  if(key===this.scoreKey)return;
  this.scoreKey=key;
  table.replaceChildren(...this.order.map(id=>{
   const row=document.createElement('tr');
   if(id===this.turn&&!this.result)row.className='hitting';
   const name=document.createElement('th');name.scope='row';name.textContent=this.name(id);
   const hole=document.createElement('td');hole.textContent=this.strokes[id];
   const total=document.createElement('td');total.textContent=this.totals[id]+this.strokes[id];
   row.append(name,hole,total);return row;
  }));
 }
 snapshot(){
  const g=this.game,a=g.golfer;
  return {kind:'frame',camera:pose(g.camera),fov:g.camera.fov,root:pose(a.root),model:pose(a.model),
   bones:Array.from(a.basePose.keys(),b=>b.quaternion.toArray()),club:g.club,
   stick:pose(a.club),head:pose(a.clubHead),held:a.club.visible,
   bag:g.bag.visible?{pose:pose(g.bag),style:g.equipment?.bag,clubs:g.equipment?.clubs,clubStyles:clubLoadout(g.equipment)}:null,
   tee:g.tee.visible,putting:g.club==='putter'&&!g.swinging&&!g.bagPhase&&!g.modal,ball:g.ball.position.toArray(),ballStyle:g.equipment?.ball,color:g.ball.material.color.getHex(),visible:g.ball.visible,shots:g.shots};
 }
 send(data){this.room.send({...data,type:'state',hole:this.hole,turn:this.turn,sequence:this.sequence})}
 update(dt){
  const g=this.game;
  if(!this.ready||this.result)return;
  if(!g.spectating){
   g.update(dt);
   this.strokes[this.turn]=g.shots;this.renderScores();
   if(performance.now()-this.lastSend>65){
    this.lastSend=performance.now();this.send(this.snapshot());
   }
   return;
  }
  g.world.waterClock.value+=dt;
  const f=this.frame;if(!f)return;
  const actor=this.lobby.actor(this.turn);
  if(actor){
   if(actor.root.parent!==g.scene)g.scene.add(actor.root);
   actor.root.visible=true;applyPose(actor.root,f.root);applyPose(actor.model,f.model);
   let i=0;for(const b of actor.basePose.keys()){const q=f.bones[i++];if(q?.length===4)b.quaternion.fromArray(q)}
   if(actor.clubType!==f.club)actor.setClub(f.club);
   applyPose(actor.club,f.stick);applyPose(actor.clubHead,f.head);actor.fitShaft();actor.club.visible=f.held;
  }
  const blend=1-Math.exp(-dt*28);
  g.setCameraFov(Number.isFinite(f.fov)&&f.fov>=54&&f.fov<=125?f.fov:g.baseCameraFov);
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
  if(m.hole!==this.hole||m.turn!==this.turn||m.sequence!==this.sequence)return;
  if(m.kind==='next'&&this.room.role==='guest'&&this.result){this.advance();return}
  if(this.room.id===this.turn||this.result)return;
  if(['stroke','finish'].includes(m.kind)&&validScore(m.score)){
   this.completeTurn(m.score,m.kind==='finish');return;
  }
  if(m.kind==='frame'&&m.camera?.length===10&&m.ball?.length===3&&Array.isArray(m.bones)){
   if(!this.frame)this.snap=true;
   this.frame=m;
   if(Number.isInteger(m.shots)&&m.shots>=this.strokes[this.turn]&&m.shots<10000){
    this.strokes[this.turn]=m.shots;$('strokeLabel').textContent=String(Math.max(1,m.shots));this.renderScores();
   }
  }
 }
 strokeSettled(){
  const score=this.game.shots;
  if(this.room.id!==this.turn||this.result||!validScore(score))return;
  this.saveLocalBall();
  this.send({kind:'stroke',score});
  this.completeTurn(score,false);
 }
 holed(score){
  if(this.room.id!==this.turn||this.result||!validScore(score))return;
  this.send({kind:'finish',score});
  this.completeTurn(score,true);
 }
 completeTurn(score,finished){
  this.strokes[this.turn]=score;
  if(finished)this.card[this.turn]=score;
  const index=this.order.indexOf(this.turn);
  for(let offset=1;offset<=this.order.length;offset++){
   const id=this.order[(index+offset)%this.order.length];
   if(Object.hasOwn(this.card,id))continue;
   this.turn=id;this.sequence++;this.playTurn(false);return;
  }
  this.result=true;this.renderScores();
  const winner=this.uniqueLeader(this.card,Math.min);
  if(winner)this.points[winner]++;
  this.complete=this.hole+1===this.length;
  const title=(id,subject)=>!id?subject+' TIED':id===this.room.id?'YOU WIN THE '+subject:this.name(id)+' WINS THE '+subject;
  const courseWinner=this.uniqueLeader(this.points,Math.max);
  $('roundEyebrow').textContent=this.complete?'COURSE COMPLETE · '+this.length+' OF '+this.length:'HOLE '+(this.hole+1)+' OF '+this.length+' COMPLETE';
  $('roundTitle').textContent=this.complete?title(courseWinner,'COURSE'):title(winner,'HOLE');
  $('roundDescription').textContent='Hole '+(this.hole+1)+' strokes · '+this.scores(this.card);
  $('scorecard').textContent=this.standings()+(this.complete?'':' · Continuing to hole '+(this.hole+2));
  const next=$('nextHole');
  next.hidden=false;next.disabled=!this.complete&&this.room.role==='guest';
  next.textContent=this.complete?'RETURN TO CLUBHOUSE':this.room.role==='host'?'CONTINUE TO HOLE '+(this.hole+2):'NEXT TEE · HOLE '+(this.hole+2);
  $('toClubhouse').hidden=true;
  $('roundModal').classList.remove('hidden');
  if(!this.complete&&this.room.role==='host')this.timer=setTimeout(()=>this.nextHole(),4500);
 }
 uniqueLeader(scores,compare){
  const best=compare(...Object.values(scores));
  const leaders=this.order.filter(id=>scores[id]===best);
  return leaders.length===1?leaders[0]:null;
 }
 name(id){return id===this.room.id?'You':'@'+this.room.players[id].name}
 scores(values){return this.order.map(id=>this.name(id)+' '+values[id]).join(' / ')}
 standings(){return 'Holes won · '+this.scores(this.points)}
 nextHole(){
  if(!this.result||this.complete||this.room.role!=='host')return;
  this.send({kind:'next'});this.advance();
 }
 advance(){
  if(!this.result||this.complete)return;
  clearTimeout(this.timer);
  for(const id of this.order)this.totals[id]+=this.card[id];
  this.hole++;this.sequence=0;this.card={};this.result=false;this.turn=this.order[0];
  this.strokes=Object.fromEntries(this.order.map(id=>[id,0]));
  this.playTurn(true);
 }
 stop(){
  clearTimeout(this.timer);this.ready=false;this.game.spectating=false;this.game.setCameraFov(this.game.baseCameraFov);this.game.ball.material.color.setHex(this.ballColor);
  const gear=this.game.equipment;
  if(gear){
   setBallFinish(this.game.ball,itemById(gear.ball));
   this.game.setBagFinish(itemById(gear.bag),gear);
  }
  document.body.classList.remove('watching-golf');$('nextHole').hidden=false;$('nextHole').disabled=false;$('toClubhouse').hidden=false;
  this.lobby.endRound();
 }
}
