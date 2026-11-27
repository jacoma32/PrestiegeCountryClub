import {clubChoice} from './locker.js?v=clubs1';
import {reachForClub,carryClub} from './club-grip.js?v=curl2';
import {WaterSplash} from './water.js?v=coast2';
import {WEDGES,wedgeLaunch} from './wedges.js?v=sand1';
import {SandBurst} from './sand-burst.js';
import {makeGolfBall} from './golf-ball.js?v=brands1';
import {buildBag} from './golf-bag.js?v=clubs1';
import {contactTime} from './shot-pose.js?v=approach2';
import {CLUB_IRONS,curveAcceleration} from './irons.js?v=irons1';
import * as THREE from 'three';
import {World,COURSES} from './world.js?v=friendflow1';
import {Golfer} from './actors.js?v=clubs1';
const clamp=THREE.MathUtils.clamp,$=id=>document.getElementById(id);
const SHAPES=['HOOK','DRAW','STRAIGHT','FADE','SLICE'];
const BAG_TAGS={driver:'Driver',wood:'3W',hybrid:'4H',pitching:'PW',approach:'AW',wedge:'SW',lob:'LW',putter:'Putter'};
const BALL_RADIUS = .02135;
const BALL_STOP_SPEED=.13;
function puttRollSpeed(speed,lie,dt){
 if(lie==='GREEN'){
  // Grass resistance persists at low speed, while a firm putt sheds speed faster.
  return Math.max(0,speed-(.12+.73*speed+.025*speed*speed)*dt);
 }
 const friction=lie==='FRINGE'?3.65:lie==='FAIRWAY'?2.8:lie==='BUNKER'?10:5.5;
 return speed*Math.exp(-friction*dt);
}
const CLUBS={driver:{name:'DRIVER',speed:43,loft:.395,range:255},wood:{name:'3 WOOD',speed:39.8,loft:.42,range:228},hybrid:{name:'4 HYBRID',speed:42.2,loft:.315,range:191},...CLUB_IRONS,
 ...WEDGES,putter:{name:'PUTTER',speed:11,loft:.015,range:25}};
export class GolfGame{
 constructor(renderer,scene,camera){this.renderer=renderer;this.scene=scene;this.camera=camera;this.baseCameraFov=camera.fov;this.world=new World(scene);this.golfer=new Golfer(scene);this.ball=this.makeBall();this.tee=this.makeTee();this.splash=new WaterSplash(scene);this.sandBurst=new SandBurst(scene);this.contactShadow=this.makeContactShadow();this.clock=new THREE.Clock();this.position=new THREE.Vector3();this.vel=new THREE.Vector3();this.swinging=false;this.swingTimer=0;this.ballLaunchDelay=.9;this.charge=0;this.charging=false;this.shots=0;this.scores=[];this.course='royal';this.roundLength=18;this.index=0;this.started=false;this.aim=0;this.club='driver';this.lastIron='iron7';this.shotShape=0;this.flightShape=0;this.impactSpin=0;this.biteTimer=0;this.wind=0;this.modal=false;this.cameraTarget=new THREE.Vector3();this.dragging=false;this.dragStart=0;this.orbit=0;this.coachActor=null;this.onSfx=()=>{};this.shotPreview=this.createShotPreview();const gear=buildBag();this.bag=gear.bag;this.bagHeads=gear.heads;this.setBagFinish=gear.setFinish;scene.add(this.bag);
 this.bagPhase=null;this.listeners();this.enterMenu()}
 makeContactShadow() {
  const material=new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,
   uniforms:{strength:{value:.3}},
   vertexShader:'varying vec2 coord;void main(){coord=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec2 coord;uniform float strength;void main(){gl_FragColor=vec4(.035,.047,.03,strength*(1.-smoothstep(.03,.49,length(coord))));}'
  });
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.13,.13),material);
  shadow.rotation.x=-Math.PI/2;this.scene.add(shadow);return shadow;
 }
 updateContactShadow() {
  const shadow=this.contactShadow;if(!shadow)return;
  const floor=this.world.ground(this.position.x,this.position.z);
  const lift=Math.max(0,this.position.y-floor-BALL_RADIUS);
  shadow.visible=this.started&&this.ball.visible&&lift<1.6;
  if(!shadow.visible)return;
  shadow.position.set(this.position.x,floor+.014,this.position.z);
  shadow.scale.setScalar(1+lift*.65);shadow.material.uniforms.strength.value=.4*(1-lift/1.6);
 }
 makeTee(){
  const tee=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:0xe0b480,roughness:.82});
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.004,.002,.047,12),wood);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.009,.004,.009,16),wood);
  stem.position.y=.022;cup.position.y=.0505;tee.add(stem,cup);
  tee.visible=false;this.scene.add(tee);return tee;
 }
 updatePlacement(){
  if(!this.placing)return;
  const actor=this.golfer,action=actor.actions.get('tee');
  if(actor.mode!=='tee'||!action||action.time>=contactTime.tee){
   this.ball.position.copy(this.position);this.placing=false;return;
  }
  const tip=this.placementFinger;
  if(tip)tip.getWorldPosition(this.ball.position);
 }
 makeBall(){
  const ball=makeGolfBall('#f9f9f3');
  ball.scale.setScalar(BALL_RADIUS);ball.castShadow=true;this.scene.add(ball);
  return ball;
 }
 prepareGolfer(frame) {
  if (this.equippedFrame === frame && this.golferReady) return this.golferReady;
  this.equippedFrame = frame;
  this.golferReady = (async () => {
   const source = await this.golfer.load(frame);
   if (this.equippedFrame === frame) await this.golfer.loadAllAnimations();
   return source;
  })().catch(error => { if(this.equippedFrame === frame) this.golferReady = null; throw error; });
  return this.golferReady;
 }
 async animations(){return this.golfer.loadAllAnimations()}
 async loadCoach(){if(this.coachActor){this.coachActor.setVisible(true);this.positionCoach();return this.coachActor}this.coachActor=new Golfer(this.scene);try{await this.coachActor.loadLocal('./assets/characters/Timmy.fbx')}catch(e){console.warn('Timmy model unavailable, using backup:',e);await this.coachActor.loadLocal('./assets/characters/Y Bot.fbx')}this.positionCoach();this.coachActor.animate('wave',true);this.coachAnimationsReady=await this.coachActor.loadAllAnimations(['idle','talk','point','pointGesture','wave','thumb','clap','cheer','drive','chip','putt','tee','pick']).catch(e=>{console.warn('Coach animations unavailable:',e);return {}});return this.coachActor}
 coachAction(action){if(!this.coachActor)return;const oneShot=['drive','chip','putt','tee','pick','clap','cheer','thumb','wave','angry','dance','footwork','freeze'];if(contactTime[action]){const spot=this.world.teePosition.clone();spot.x+=3;spot.y=this.world.ground(spot.x,spot.z)+.10;this.coachActor.alignShot(action,spot,this.shotDirection(),spot.y-.10)}else{this.positionCoach();this.coachActor.club.visible=false}if(oneShot.includes(action))this.coachActor.shot(action);else this.coachActor.animate(action,true)}
 positionCoach(){if(!this.coachActor)return;const p=this.world.teePosition;this.coachActor.root.position.set(p.x+4,this.world.ground(p.x+4,p.z-1),p.z-1);this.coachActor.root.rotation.y=Math.PI-.25;}
 createShotPreview(){const group=new THREE.Group();this.scene.add(group);const mat=new THREE.LineBasicMaterial({color:0x35d4ff,transparent:true,opacity:.9,depthTest:false});const line=new THREE.Line(new THREE.BufferGeometry(),mat);line.renderOrder=50;group.add(line);const marker=new THREE.Mesh(new THREE.RingGeometry(.8,1.07,48),new THREE.MeshBasicMaterial({color:0x50e9ff,transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false}));marker.rotation.x=-Math.PI/2;marker.renderOrder=50;group.add(marker);group.visible=false;return{group,line,marker}}
 launchVelocity(power) {
  const club = CLUBS[this.club], lie = this.world.lie(this.position.x, this.position.z);
  if(WEDGES[this.club]){
   const {horizontal,vertical}=wedgeLaunch(club,power,lie);
   const velocity=this.shotDirection().multiplyScalar(horizontal);
   velocity.y=vertical;
   return velocity;
  }
  const surface = lie === 'BUNKER' ? .52 : lie === 'ROUGH' ? .84 : 1;
  const speed = club.speed * Math.pow(power, .8) * surface;
  const velocity = this.shotDirection().multiplyScalar(speed * Math.sqrt(1 - club.loft ** 2));
  if (this.club === 'putter') velocity.multiplyScalar(.8 * (1 + .5 * THREE.MathUtils.smoothstep(power,.25,1)));
  velocity.y = this.club === 'putter' ? 0 : speed * club.loft;
  return velocity;
 }
 advanceFlight(position, velocity, dt, airborne, shape=this.flightShape) {
  const driving = (this.club==='driver'||this.club==='wood') && airborne;
  if (driving) {
   const drag = Math.exp(-.145 * dt);
   velocity.x *= drag;
   velocity.z *= drag;
  }
  if (airborne&&this.club!=='putter'){velocity.x+=this.wind*.18*dt;const lateral=curveAcceleration(shape,velocity);velocity.x+=lateral.x*dt;velocity.z+=lateral.z*dt;}
  velocity.y -= (driving ? 6.4 : 9.81) * dt;
  if(!this.world.treeContact?.deflect(position,velocity,dt))position.addScaledVector(velocity,dt);
 }
 updateShotPreview() {
  const {group, line, marker} = this.shotPreview;
  group.visible = this.started && !this.swinging && !this.modal;
  if (!group.visible) return;
  const putting=this.club==='putter';
  const power=this.charging?clamp(this.charge,putting?.02:.11,1):1;
  const key=[this.club,power,this.aim,this.shotShape,this.wind,this.position.x,this.position.y,this.position.z].join(',');
  if(this.previewKey===key&&this.previewHole===this.world.hole)return;
  const state={
   position:this.position.clone(),vel:this.launchVelocity(power),flightShape:this.shotShape,
   carryYards:null,shotOrigin:this.position,biteTimer:0,impactSpin:CLUBS[this.club].spin??0,
  };
  const points=[state.position.clone()];
  let carryPoint,carryIndex,outcome;
  for(let step=0;step<2400;step++){
   outcome=this.advanceBall(state,1/120);
   if(!carryPoint&&state.carryYards!==null){
    carryPoint=state.position.clone();
    carryIndex=points.push(carryPoint);
   }else if(step%8===0)points.push(state.position.clone());
   if(outcome==='water'||outcome==='cup'||outcome==='rest')break;
  }
  points.push(state.position.clone());
  this.predictedPath=points;
  const distance=this.travelYards(state);
  const shape=putting?'PUTT':SHAPES[this.shotShape+2];
  const finish=outcome==='water'?' · WATER':outcome==='cup'?' · CUP':'';
  this.predictedResult=shape+' · '+(putting?Math.round(Math.hypot(state.position.x-this.position.x,state.position.z-this.position.z)*5.25)+' FT':distance+' YD')+finish;
  this.previewKey=key;this.previewHole=this.world.hole;
  const point=!putting&&carryPoint?carryPoint:points.at(-1);
  const displayedPoints=!putting&&carryIndex?points.slice(0,carryIndex):points;
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(displayedPoints);
  marker.position.copy(point);
  marker.position.y += .07;
  const carry = Math.round(Math.hypot(point.x-this.position.x,point.z-this.position.z)*1.75);
  $('shotPreviewText').textContent = CLUBS[this.club].name + (WEDGES[this.club]?' '+WEDGES[this.club].degrees+'°':'') + ' · ' + carry + (putting?' YDS ROLL · ':' YDS CARRY · ') + SHAPES[this.shotShape+2] + ' · ' + Math.round(this.aim) + '° AIM';
 }
 enterMenu(){this.charging=false;this.dragging=false;this.placing=false;this.tee.visible=false;this.clearBag();this.started=false;this.previewMode=false;this.shotPreview.group.visible=false;this.world.create('royal',0);this.ball.visible=false;this.golfer.setVisible(false);this.coachActor?.setVisible(false);this.camera.position.set(39,37,110);this.camera.lookAt(-4,3,-45)}
 enterPreview(){this.golfer.stanceGround=null;this.previewMode=true;this.golfer.club.visible=false;this.golfer.setVisible(true);this.golfer.root.position.set(0,this.world.ground(0,67),67);this.golfer.root.rotation.set(0,0,0);this.menuCamera(1);this.golfer.animate('idle',true)}
 async begin(course='royal',tutorial=false,length=18){await this.golferReady;this.tutorial=tutorial;this.course=course;this.roundLength=Math.min(length===9?9:18,COURSES[course].holes.length);this.roundId=crypto.randomUUID();this.scores=[];if(tutorial)await this.loadCoach();this.startHole(0);if(tutorial){this.coachActor?.setVisible(true);this.positionCoach()}}
 resetBallToTee() {
  this.position.copy(this.world.teePosition);
  this.position.y = this.world.ground(this.position.x, this.position.z) + BALL_RADIUS + .055;
  this.tee.position.copy(this.position);this.tee.position.y-=BALL_RADIUS+.055;
  this.tee.visible=true;
  this.ball.position.copy(this.position);
 }
 startHole(index){this.clearBag();this.index=index;this.world.create(this.course,index);const hole=this.world.hole;this.ball.visible=true;this.resetBallToTee();this.vel.set(0,0,0);this.swinging=false;this.charging=false;this.swingTimer=0;this.charge=0;this.shots=0;this.aim=0;this.shotShape=0;this.flightShape=0;this.biteTimer=0;this.wind=(Math.random()-.5)*COURSES[this.course].wind*.5;this.started=true;this.modal=false;this.golfer.setVisible(true);this.applyClub(this.course==='range'?'driver':this.suggestClub());this.golfer.onShotEnd=()=>{if(this.started&&!this.swinging&&!this.modal&&!this.bagPhase)this.placeGolfer()};this.placeGolfer('tee');this.golfer.shot('tee');this.placing=true;
  this.placementFinger=[...this.golfer.basePose.keys()].find(b=>b.name.endsWith('RightHandIndex3'));
  this.updatePlacement();this.orbit=0;this.moveCamera(0,true);if(this.coachActor){this.coachActor.setVisible(!!this.tutorial);this.positionCoach()}$('roundModal').classList.add('hidden');$('courseLabel').textContent=COURSES[this.course].name;$('holeLabel').textContent=`HOLE ${String(index+1).padStart(2,'0')} · ${hole.name.toUpperCase()}`;$('parLabel').textContent=hole.par;const range=this.course==='range';
  const stats=document.querySelector('.hole-stat');if(stats)stats.style.display=range?'none':'';
  if(range)$('holeLabel').textContent='PRACTICE TEE';
  this.notify(this.tutorial&&index===0?'COACH TIMMY: LET’S SET UP YOUR FIRST SHOT':hole.hint.toUpperCase());this.refresh()}
 distanceToPin(){
  const pin=this.world.holePosition;
  return Math.hypot(pin.x-this.position.x,pin.z-this.position.z)*1.75;
 }
 suggestClub(lie=this.world.lie(this.position.x,this.position.z)){
  if(lie==='GREEN')return 'putter';
  const distance=this.distanceToPin();
  let closest='driver',gap=Infinity;
  for(const [id,club] of Object.entries(CLUBS)){
   if(id==='putter'&&lie!=='FRINGE')continue;
   const difference=Math.abs(distance-club.range);
   if(difference<gap||(difference===gap&&club.range<CLUBS[closest].range)){
    closest=id;gap=difference;
   }
  }
  return closest;
 }
 applyClub(id){
  this.club=id;
  if(id==='putter')this.shotShape=this.flightShape=0;
  this.golfer.setClub(id);
 }
 shotName(){return this.club==='putter'?'putt':(WEDGES[this.club]||CLUBS[this.club]?.isIron)?'chip':'drive'}
 shotDirection(aim=this.aim){
  const pin=this.world.holePosition.clone().sub(this.position);
  const angle=Math.atan2(pin.x,-pin.z)+aim*Math.PI/180;
  return new THREE.Vector3(Math.sin(angle),0,-Math.cos(angle));
 }
 placeGolfer(name=this.shotName()){
  this.golfer.alignShot(name,this.position,this.shotDirection(),this.world.ground(this.position.x,this.position.z),(x,z)=>this.world.ground(x,z));
  if(name!=='tee')this.golfer.address(name);
  this.positionBag();
 }
 notify(t){$('banner').textContent=t}
 clearBag(){
  this.waterWait=0;this.impactPending=false;this.whooshPending=false;this.splash.group.visible=false;
  if(this.sandBurst)this.sandBurst.mesh.visible=false;
  this.golfer.carrying=false;this.resetBagLift();this.bagPhase=null;this.bagLie=null;
  if(this.bag)this.bag.visible=false;
  this.bagFieldOfView=null;
  if(this.baseCameraFov)this.setCameraFov(this.baseCameraFov);
  const panel=$('bagPanel');if(panel)panel.hidden=true;
  document.body?.classList.remove('at-bag');
 }
 showBagClubs(held){
  for(const head of this.bagHeads){head.visible=head.userData.shaft.visible=head.userData.club!==held}
 }
 positionBag(){
  if(!this.bag)return;
  this.bag.visible=true;this.showBagClubs(this.club);
  if(this.bagLie?.x===this.position.x&&this.bagLie.z===this.position.z)return;
  this.bagLie=this.position.clone();
  this.bagFieldOfView=null;
  const line=this.shotDirection(),side=new THREE.Vector3(line.z,0,-line.x);
  const spot=this.bag.position;
  if(this.world.lie(this.position.x,this.position.z)==='GREEN'&&this.parkBagOffGreen(spot))return;
  // Prefer the golfer's side of the line and keep the bag on dry ground.
  for(const distance of [2.4,-2.4,1.5,-1.5,.8]){
   spot.copy(this.position).addScaledVector(side,distance).addScaledVector(line,-1.15);
   if(this.world.lie(spot.x,spot.z)!=='WATER')break;
  }
  spot.y=this.world.ground(spot.x,spot.z);
 }
 parkBagOffGreen(spot){
  const {world}=this,{x,z,rx,rz}=world.green;
  const camera=this.camera.clone(),line=this.shotDirection(0);
  const baseFov=this.baseCameraFov??camera.fov;
  camera.fov=baseFov;camera.updateProjectionMatrix();
  const target=new THREE.Vector3();
  this.addressCamera(line,0,camera.position,target);
  camera.lookAt(target);camera.updateMatrixWorld(true);
  const point=new THREE.Vector3(),screen=new THREE.Vector3();
  let best=Infinity,bestFov=baseFov;
  for(const margin of [1.95,2.65,3.5,4.5,6]){
   for(let i=0;i<72;i++){
    const angle=i*Math.PI/36,edge=world.greenEdge(angle);
    const px=x+Math.cos(angle)*(rx+margin)*edge,pz=z+Math.sin(angle)*(rz+margin)*edge;
    if(world.lie(px,pz)!=='ROUGH')continue;
    point.set(px,world.ground(px,pz),pz);
    screen.copy(point);screen.y+=.65;screen.project(camera);
    if(screen.z<0||screen.z>1)continue;
    const scale=Math.max(1,Math.abs(screen.x)/.84,Math.abs(screen.y)/.76);
    const fov=2*Math.atan(Math.tan(baseFov*Math.PI/360)*scale)*180/Math.PI;
    if(fov>125)continue;
    // Keep the bag away from the putt line and favor the nearest visible rough.
    const score=point.distanceTo(this.position)+margin*3+(fov-baseFov)*2+Math.max(0,.25-Math.abs(screen.x))*12;
    if(score<best){best=score;bestFov=fov;spot.copy(point)}
   }
   if(bestFov===baseFov&&best<Infinity)break;
  }
  this.bagFieldOfView=bestFov;
  return best<Infinity;
 }
 openBag(){
  if(this.placing||this.spectating)return;
  if(!this.started||this.swinging||this.charging||this.modal||this.bagPhase)return;
  this.placeGolfer();
  this.addressPoint=this.golfer.root.position.clone();
  const approach=this.addressPoint.clone().sub(this.bag.position).setY(0);
  approach.clampLength(0,.40);
  this.walkTarget=this.bag.position.clone().add(approach);
  this.bagPhase='out';this.golfer.club.visible=false;this.golfer.animate('walk',true);
  this.shotPreview.group.visible=false;this.notify('WALKING TO CLUB BAG');
  document.body?.classList.add('at-bag');
 }
 returnFromBag(id){
  if(this.bagPhase!=='select'||!CLUBS[id])return;
  this.club=id;if(id==='putter')this.shotShape=this.flightShape=0;
  const head=this.bagHeads.find(item=>item.userData.club===id);
  const shaft=head.userData.shaft;
  this.pickPoint=shaft.getWorldPosition(new THREE.Vector3()).lerp(head.getWorldPosition(new THREE.Vector3()),.45);
  this.pickStance=this.golfer.root.position.clone();
  this.pickTime=0;this.bagPhase='pickup';this.golfer.setClub(id);
  $('bagPanel').hidden=true;this.notify(CLUBS[id].name);

 }
 resetBagLift(){
  this.hoverClub=null;
  for(const head of this.bagHeads){
   head.position.y=head.userData.restY;
   head.userData.shaft.position.y=head.userData.shaftY;
  }
 }
 inspectBag(){
  const contents=$('bagContents');contents.replaceChildren();
  this.clubTags=new Map();
  for(const head of this.bagHeads){
   const id=head.userData.club,tag=document.createElement('button');
   tag.dataset.pick=id;tag.textContent=BAG_TAGS[id]||id.slice(4)+'I';
   const item=clubChoice(this.equipment,id);
   const label=item.slot==='clubs'?CLUBS[id].name:`${CLUBS[id].name} · ${item.brand} ${item.name}`;
   tag.setAttribute('aria-label',label);tag.title=label;
   tag.onpointerenter=tag.onfocus=()=>this.highlightBagClub(id);
   tag.onpointerleave=tag.onblur=()=>this.highlightBagClub(null);
   contents.append(tag);this.clubTags.set(id,tag);
  }
 }
 highlightBagClub(id){
  if(this.bagPhase!=='select'||this.hoverClub===id)return;
  this.hoverClub=id;
  this.notify(id?CLUBS[id].name:'CHOOSE A CLUB');
  for(const [club,tag] of this.clubTags)tag.classList.toggle('lifted',club===id);
 }
 clubUnderPointer(event){
  if(this.bagPhase!=='select')return null;
  const rect=this.renderer.domElement.getBoundingClientRect();
  const pointer=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  const ray=new THREE.Raycaster();ray.setFromCamera(pointer,this.camera);
  const hits=ray.intersectObjects(this.bagHeads.flatMap(h=>[h,h.userData.shaft]),true);
  if(hits.length){
   const item=hits[0].object;
   return this.bagHeads.find(h=>h===item||h.getObjectById(item.id)||h.userData.shaft===item).userData.club;
  }
  // Keep the original head position selectable while it lifts away from the pointer.
  if(this.hoverClub){
   const head=this.bagHeads.find(h=>h.userData.club===this.hoverClub);
   const lift=head.position.y-head.userData.restY;
   // Test the resting silhouette too, including clicks near the edge of the head.
   ray.ray.origin.y+=lift;
   if(ray.intersectObjects([head,head.userData.shaft],true).length)return this.hoverClub;
  }
  return null;
 }
 displayBag(dt){
  const spot=this.bag.position;
  const distance=Math.max(.72,.53/this.camera.aspect);
  const target=spot.clone().add(new THREE.Vector3(0,1.15,0));
  this.camera.position.copy(target).addScaledVector(new THREE.Vector3(0,.72,.70),distance);
  this.camera.lookAt(target);this.camera.updateMatrixWorld();
  for(const head of this.bagHeads){
   const {club,restY,shaft,shaftY}=head.userData;
   const lift=THREE.MathUtils.lerp(head.position.y-restY,this.hoverClub===club?.065:0,1-Math.exp(-dt*16));
   head.position.y=restY+lift;shaft.position.y=shaftY+lift;
   const anchor=head.position.clone();anchor.y=restY-.022;
   this.bag.localToWorld(anchor).project(this.camera);
   const tag=this.clubTags.get(club);
   tag.style.left=((anchor.x+1)*50)+'%';tag.style.top=((1-anchor.y)*50)+'%';
  }
  this.bag.updateMatrixWorld(true);
 }
 updateBag(dt){
  const root=this.golfer.root,spot=this.bag.position;
  if(this.bagPhase==='pickup'){
   const golfer=this.golfer;
   this.pickTime+=dt;
   const reach=THREE.MathUtils.smoothstep(this.pickTime,0,.36);
   const release=THREE.MathUtils.smoothstep(this.pickTime,.48,1.12);
   root.position.copy(this.pickStance);
   const weight=reach*(1-release);
   reachForClub(golfer.palm,this.pickPoint,weight);
   if(golfer.palm?.arm){
    // Shift weight toward the selected slot, including clubs on the far side.
    const gap=this.pickPoint.clone().sub(golfer.palm.socket.getWorldPosition(new THREE.Vector3()));
    root.position.x+=gap.x*weight;root.position.z+=gap.z*weight;
    root.position.y=this.world.ground(root.position.x,root.position.z);
    reachForClub(golfer.palm,this.pickPoint,weight);
   }
   if(this.pickTime>=.36){
    if(!golfer.carrying){
     const localUp=new THREE.Vector3(0,1,0).applyQuaternion(golfer.club.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
     this.upright=new THREE.Quaternion().setFromUnitVectors(golfer.shaftAxis,localUp);
     golfer.club.scale.setScalar(golfer.clubBaseScale||1);
     this.showBagClubs(this.club);golfer.club.visible=true;golfer.carrying=true;
    }
    carryClub(golfer,release,this.upright);
    golfer.gripPressure=THREE.MathUtils.lerp(.35,1,THREE.MathUtils.smoothstep(this.pickTime,.36,.46))
      -.28*Math.sin(release*Math.PI);
   }
   if(this.pickTime>=1.12){
    this.resetBagLift();this.walkTarget=this.addressPoint;this.bagPhase='back';golfer.animate('walk',true);
   }
  }else if(this.bagPhase!=='select'){
   const dx=this.walkTarget.x-root.position.x,dz=this.walkTarget.z-root.position.z;
   const distance=Math.hypot(dx,dz),step=Math.min(distance,dt*1.45);
   if(distance>.001){
    root.rotation.y=Math.atan2(dx,dz);root.position.x+=step*dx/distance;root.position.z+=step*dz/distance;
    root.position.y=this.world.ground(root.position.x,root.position.z);
   }
   if(distance<=step+.001){
    if(this.bagPhase==='back'){
     this.golfer.carrying=false;this.bagPhase=null;document.body?.classList.remove('at-bag');this.chooseClub(this.club);
     this.moveCamera(0,true);this.notify('ADDRESS THE BALL');return;
    }
    this.bagPhase='select';this.showBagClubs(null);root.rotation.y=Math.atan2(spot.x-root.position.x,spot.z-root.position.z);
    this.golfer.animate('idle',true);$('bagPanel').hidden=false;
    this.inspectBag();
    this.notify('CHOOSE A CLUB');
   }
  }
  if(this.bagPhase==='select'){this.displayBag(dt);return}
  const target=root.position.clone().lerp(spot,.52);target.y+=.91;
  const eye=target.clone().add(new THREE.Vector3(.35,.64,2.55));
  this.camera.position.lerp(eye,1-Math.exp(-dt*5));this.camera.lookAt(target);
 }
 chooseClub(c){if(this.spectating)return;if(!CLUBS[c]||this.swinging||this.modal||this.bagPhase)return;this.applyClub(c);this.placeGolfer();this.refresh()}
 setShape(shape){if(this.spectating)return;if(this.club==='putter'||this.swinging||this.modal||this.bagPhase)return;this.shotShape=Math.max(-2,Math.min(2,Math.round(Number(shape)||0)));this.refresh()}
 aimDelta(d){if(this.spectating||this.placing)return;if(this.bagPhase||this.swinging||this.modal)return;this.aim=clamp(this.aim+d,-65,65);this.placeGolfer();this.refresh()}
 refresh(){const c=CLUBS[this.club];$('clubLabel').textContent=c.name;$('windLabel').textContent=`${this.wind>0?'↗':'↖'} ${Math.abs(this.wind*2.2).toFixed(0)} MPH`;$('strokeLabel').textContent=this.shots+1;const completedScore=this.scores.reduce((sum,strokes,i)=>sum+strokes-COURSES[this.course].holes[i].par,0);$('scoreLabel').textContent=completedScore===0?'E':completedScore>0?'+'+completedScore:String(completedScore);$('aimLabel').textContent=`${Math.round(this.aim)}°`;$('lieLabel').textContent=this.world.lie(this.position.x,this.position.z);$('distanceLabel').textContent=`${Math.round(this.distanceToPin())} YDS TO PIN`;if(this.club==='putter')$('distanceLabel').textContent=(this.distanceToPin()*3).toFixed(1)+' FT TO CUP';if(this.course==='range')$('distanceLabel').textContent='50–250 YD TARGETS';$('powerLabel').textContent=`${Math.round(this.charge*100)}%`;$('meterBar').style.width=`${this.charge*100}%`;const shapes=document.querySelector('.iron-shape');if(shapes)shapes.hidden=this.club==='putter';
 document.querySelectorAll('[data-shape]').forEach(button=>{
  const selected=Number(button.dataset.shape)===this.shotShape;
  button.classList.toggle('active',selected);
  button.setAttribute('aria-pressed',String(selected));
 });this.updateShotPreview()}
 startCharge(){
  if(this.placing||this.spectating||this.bagPhase||!this.started||this.swinging||this.modal||this.charging)return false;
  this.placeGolfer();this.charging=true;this.orbit=0;this.moveCamera(0,true);this.charge=0;
  this.notify(this.touchControls?'HOLD FOR POWER · RELEASE TO HIT':'HOLD SPACE FOR POWER · RELEASE TO SWING');
  return true;
 }
 cancelCharge(){
  if(!this.charging)return;
  this.charging=false;this.charge=0;
  if(this.started){this.notify('ADDRESS THE BALL');this.refresh()}
 }
 releaseShot(){if(!this.charging||this.swinging||this.modal)return;this.charging=false;const p=clamp(this.charge,this.club==='putter'?.02:.11,1);this.shots++;this.swinging=true;this.swingTimer=0;this.shotPreview.group.visible=false;this.impactPending=true;this.whooshPending=true;this.strikePower=p;this.cameraShotLine=this.shotDirection();this.shotOrigin=this.position.clone();this.carryYards=null;this.vel.copy(this.launchVelocity(p));this.flightShape=this.shotShape;this.shotShape=0;this.impactSpin=CLUBS[this.club].isIron?CLUBS[this.club].spin:0;this.biteTimer=0;this.ballLaunchDelay=contactTime[this.shotName()];this.golfer.shot(this.shotName());this.notify(p>.74&&p<.88?'PURE STRIKE':'SHOT IN PLAY');this.refresh()}
 update(dt){dt=Math.min(dt,.04);this.world.waterClock.value+=dt;this.splash.update(dt);this.sandBurst?.update(dt);this.golfer.update(dt);this.updatePlacement();
  if(this.waterWait>0){
   this.waterWait=Math.max(0,this.waterWait-dt);this.moveCamera(dt);
   if(!this.waterWait){
    this.shots++;this.position.copy(this.shotOrigin);this.ball.position.copy(this.position);
    this.swinging=false;this.ball.visible=true;this.placeGolfer();this.refresh();this.moveCamera(0,true);
    this.notify('WATER · +1 PENALTY · REPLAY FROM LAST SPOT');
    this.onShotSettled?.(this.shots);
   }
   return;
  }
  this.coachActor?.update(dt);if(this.bagPhase){this.updateBag(dt);return}if(this.charging){this.charge=Math.min(1,this.charge+dt*.8);this.refresh()}if(this.started){if(this.swinging){this.swingTimer+=dt;const flightTime=Math.min(dt,this.swingTimer-this.ballLaunchDelay);
  if(this.whooshPending&&this.swingTimer>=this.ballLaunchDelay-.16){
   this.whooshPending=false;this.onSfx('whoosh',{club:this.club,power:this.strikePower});
  }
  if(flightTime>=0&&this.impactPending){
   this.impactPending=false;
   const lie=this.world.lie(this.shotOrigin.x,this.shotOrigin.z);
   this.onSfx('strike',{club:this.club,power:this.strikePower,lie});
   if(lie==='BUNKER')this.sandBurst?.start(this.shotOrigin,this.cameraShotLine,this.strikePower);
  }
  for(let left=flightTime;left>1e-8&&this.swinging&&!this.waterWait;left-=1/120)this.stepBall(Math.min(left,1/120))}
  if(this.swinging)this.golfer.watchFlight(this.position,this.swingTimer-this.ballLaunchDelay);
  this.moveCamera(dt)}else this.menuCamera(dt);this.updateContactShadow()}
 groundContact(state,lie,dt){
  const first=state.carryYards===null;
  if(first)state.carryYards=this.travelYards(state);
  const sand=lie==='BUNKER',green=lie==='GREEN',fairway=lie==='FAIRWAY',club=CLUBS[this.club];
  if(this.club==='putter'){
   const speed=Math.hypot(state.vel.x,state.vel.z);
   state.vel.y=0;
   if(speed>0)state.vel.multiplyScalar(puttRollSpeed(speed,lie,dt)/speed);
   return;
  }
  const descent=Math.max(0,-state.vel.y);
  if(descent>(fairway?.85:1.7)){
   if(state===this)this.onSfx('land');
   const turfRetention=club.stop??(this.club==='driver'?.64:.75);
   const retention=fairway&&!first?.87:turfRetention*(sand?.23:green?.70:1);
   state.vel.x*=retention;state.vel.z*=retention;
   state.vel.y=descent*(sand?.045:green?.14:fairway?(first?.34:.30):.24);
   if(state.vel.y<(fairway?.22:.45))state.vel.y=0;
   if(club.isIron)state.biteTimer=.65;
   return;
  }
  // Catch shallow arrivals too, without applying the impact loss on every roll step.
  const shallowRetention=WEDGES[this.club]?.stop??.78;
  const skid=first?(sand?.24:green?shallowRetention:1):1;
  const friction=sand?10:green?2.04:fairway?2.8:lie==='FRINGE'?3.65:5.5;
  const bite=club.isIron&&state.biteTimer>0?state.impactSpin/1700:0;
  state.biteTimer=Math.max(0,state.biteTimer-dt);
  const drag=skid*Math.exp(-(friction+bite)*dt);
  state.vel.x*=drag;state.vel.z*=drag;state.vel.y=0;
 }
 advanceBall(state,dt){
  const {position,vel}=state;
  const airborne=state.carryYards===null||vel.y!==0||position.y>this.world.ground(position.x,position.z)+BALL_RADIUS+.015;
  this.advanceFlight(position,vel,dt,airborne,state.flightShape);
  const ground=this.world.ground(position.x,position.z)+BALL_RADIUS;
  const lie=this.world.lie(position.x,position.z);
  if(lie==='WATER'&&position.y<=ground+.015){position.y=ground;return 'water'}
  if(position.y<=ground||(!airborne&&position.y-ground<.06)){
   position.y=ground;this.groundContact(state,lie,dt);
  }
  const pin=this.world.holePosition;
  if(this.course!=='range'&&Math.hypot(position.x-pin.x,position.z-pin.z)<.38&&position.y<ground+.4&&vel.length()<9)return 'cup';
  if(vel.length()<BALL_STOP_SPEED&&Math.abs(position.y-ground)<.015){
   position.y=ground;return 'rest';
  }
 }
 stepBall(dt){
  const outcome=this.advanceBall(this,dt);
  this.ball.position.copy(this.position);
  if(outcome==='water'){
   this.splash.start(this.position,this.vel);
   this.onSfx('hazard',{speed:this.vel.length()});this.vel.set(0,0,0);this.ball.visible=false;this.waterWait=1.45;
   return;
  }
  this.ball.rotation.x+=this.vel.z*dt*1.6;this.ball.rotation.z+=this.vel.x*dt*1.6;
  if(outcome==='cup'){this.finishHole();return}
  if(outcome!=='rest')return;
  this.vel.set(0,0,0);this.swinging=false;this.onSfx('land');
 if(this.course==='range'){
  const total=this.travelYards();this.resetBallToTee();this.charge=0;
  this.placeGolfer();this.refresh();this.moveCamera(0,true);
  this.notify('BALL '+this.shots+' · '+this.carryYards+' YDS CARRY · '+total+' YDS TOTAL');return;
 }
 const lie=this.world.lie(this.position.x,this.position.z);
 const message=this.club==='driver'?this.carryYards+' YDS CARRY · '+this.travelYards()+' YDS TOTAL · '+lie:
  lie==='BUNKER'?'SAND TRAP · PLAY IT WHERE IT LIES':lie==='GREEN'?'ON THE GREEN':`BALL AT REST · ${lie}`;
 this.applyClub(this.suggestClub(lie));
 this.placeGolfer();this.refresh();this.notify(message);
 this.onShotSettled?.(this.shots);
 }
 travelYards(state=this){return Math.round(Math.hypot(state.position.x-state.shotOrigin.x,state.position.z-state.shotOrigin.z)*1.75)}
 addressCamera(line,orbit,desired,target){
  if(this.club==='putter'){
   const cup=this.world.holePosition;
   const span=clamp(Math.hypot(cup.x-this.position.x,cup.z-this.position.z),1.2,9);
   const offset=line.clone().multiplyScalar(-2.2-span*.24);
   if(orbit)offset.applyAxisAngle(new THREE.Vector3(0,1,0),orbit);
   desired.copy(this.position).add(offset);
   desired.y=Math.max(this.position.y,this.world.ground(desired.x,desired.z))+2.1+span*.52;
   target.copy(this.position).lerp(cup,Math.min(.48,4/span));
   return;
  }
  const root=this.golfer.root.position,shoulder=new THREE.Vector3(-line.z,0,line.x);
  const offset=line.clone().multiplyScalar(-3.4).addScaledVector(shoulder,.55);
  if(orbit)offset.applyAxisAngle(new THREE.Vector3(0,1,0),orbit);
  desired.copy(root).add(offset);
  desired.y=this.world.ground(desired.x,desired.z)+1.55;
  target.copy(root).lerp(this.position,.5);
  target.y+=.95;
 }
 setCameraFov(fov){
  if(this.camera.fov===fov)return;
  this.camera.fov=fov;this.camera.updateProjectionMatrix();
 }
 moveCamera(dt, snap = false) {
  const tracking = this.swinging && this.swingTimer >= this.ballLaunchDelay;
  const desired = this.cameraTarget.clone();
  if (tracking) {
   // Ease the camera body, but keep the lens pointed exactly at the ball.
   desired.copy(this.position).addScaledVector(this.cameraShotLine, -4.5);
   desired.y += 1.15;
   desired.y = Math.max(desired.y, this.world.ground(desired.x, desired.z) + .5);
   this.cameraTarget.copy(this.ball.position);
  } else {
   this.addressCamera(this.shotDirection(),this.swinging||this.charging?0:this.orbit,desired,this.cameraTarget);
  }
  const ease=snap?1:1-Math.exp(-dt*8);
  const fov=(!tracking&&this.bagFieldOfView)||this.baseCameraFov||this.camera.fov;
  const nextFov=THREE.MathUtils.lerp(this.camera.fov,fov,ease);
  this.setCameraFov(Math.abs(nextFov-fov)<.01?fov:nextFov);
  this.camera.position.lerp(desired,ease);
  this.camera.lookAt(this.cameraTarget);
 }
 menuCamera(dt){if(this.previewMode){const target=this.golfer.root.position.clone().add(new THREE.Vector3(0,1,0)),desired=target.clone().add(new THREE.Vector3(.25,.15,2.7));this.camera.position.lerp(desired,Math.min(1,dt*4));this.camera.lookAt(target);this.golfer.root.rotation.y=Math.sin(performance.now()*.00025)*.24;return}const t=performance.now()*.0001,desired=new THREE.Vector3(36+Math.sin(t)*16,30,-5+Math.cos(t)*35);this.camera.position.lerp(desired,dt*.4);this.camera.lookAt(this.world.holePosition.clone().lerp(this.world.teePosition,.42).add(new THREE.Vector3(0,3,0)))}
 renderScorecard(){
  const groups=[this.scores.slice(0,9),this.scores.slice(9)];
  $('scorecard').innerHTML=groups.map((scores,half)=>{
   if(!scores.length)return '';
   const offset=half*9;
   const numbers=scores.map((_,i)=>`<th scope="col">${offset+i+1}</th>`).join('');
   const strokes=scores.map(score=>`<td>${score}</td>`).join('');
   const sum=scores.reduce((total,score)=>total+score,0);
   return `<table><caption>${half?'Back nine':'Front nine'}</caption><thead><tr><th>Hole</th>${numbers}<th>Total</th></tr></thead><tbody><tr><th scope="row">Strokes</th>${strokes}<td>${sum}</td></tr></tbody></table>`;
  }).join('');
 }
 finishHole(){if(this.modal||!this.started||this.course==='range'||this.scores.length!==this.index||this.shots<1)return;this.onSfx('cup');this.shotPreview.group.visible=false;this.swinging=false;this.charging=false;this.modal=true;this.scores.push(this.shots);const par=this.world.hole.par,d=this.shots-par;let title=d===-3?'ALBATROSS':d===-2?'EAGLE':d===-1?'BIRDIE':d===0?'PAR':d===1?'BOGEY':d===2?'DOUBLE BOGEY':`${d>0?'+':''}${d}`;if(this.shots===1)title='HOLE IN ONE';$('roundEyebrow').textContent='HOLE COMPLETE';$('roundTitle').textContent=title;$('roundDescription').textContent=`${this.shots} STROKES · PAR ${par} · ${COURSES[this.course].name}`;this.onHoleComplete?.(this.roundId,this.index,this.shots);this.renderScorecard();$('nextHole').textContent=this.index===this.roundLength-1?'VIEW FINAL SCORE →':'NEXT HOLE →';$('roundModal').classList.remove('hidden');if(d<0)this.golfer.shot('cheer')}
 next(){if(this.index+1<this.roundLength){this.startHole(this.index+1);return}const total=this.scores.reduce((a,b)=>a+b,0),par=COURSES[this.course].holes.slice(0,this.roundLength).reduce((a,b)=>a+b.par,0),diff=total-par;$('roundEyebrow').textContent='ROUND COMPLETE';$('roundTitle').textContent=diff===0?'EVEN PAR':diff>0?`+${diff}`:String(diff);$('roundDescription').textContent=`${total} TOTAL STROKES · ${this.roundLength} HOLES · ${COURSES[this.course].name}`;this.renderScorecard();$('nextHole').textContent='PLAY AGAIN ↻';this.index=this.roundLength;const key='prestiege-records';try{const records=JSON.parse(localStorage.getItem(key)||'[]');records.push({course:this.course,total,par,holes:this.roundLength,date:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(records.slice(-50)))}catch{}}
 actionNext(){if(this.index===this.roundLength){this.begin(this.course,false,this.roundLength);return}this.next()}
 listeners(){
  let keyboardCharging=false;
  window.addEventListener('keydown',event=>{
   if(!this.started||this.spectating||this.modal||event.defaultPrevented||event.target.closest?.('input,select,textarea,dialog,#touchSwing')||$('tutorialOverlay')?.matches(':not(.hidden)'))return;
   if(['Space','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
   if(event.code==='Space'&&!event.repeat)keyboardCharging=this.startCharge();
   if(event.code==='ArrowLeft'||event.code==='KeyA')this.aimDelta(-2);
   if(event.code==='ArrowRight'||event.code==='KeyD')this.aimDelta(2);
   if(event.code==='KeyC'&&!event.repeat){this.cancelCharge();this.openBag()}
   if(event.code==='Escape')this.returnFromBag(this.club);
   if(event.code==='KeyZ')this.setShape(-1);
   if(event.code==='KeyX')this.setShape(0);
  });
  window.addEventListener('keyup',event=>{
   if(event.code!=='Space'||!keyboardCharging)return;
   keyboardCharging=false;this.releaseShot();
  });
  window.addEventListener('blur',()=>{keyboardCharging=false;this.dragging=false;this.cancelCharge()});
  window.addEventListener('pointerdown',event=>{
   if(!event.isPrimary||!this.started||this.spectating||!event.target.closest('#playing')||event.target.closest('.game-hud,button,.modal,#tutorialOverlay'))return;
   this.dragging=true;this.dragStart=event.clientX;
  });
  window.addEventListener('pointermove',event=>{
   if(!this.dragging||!event.isPrimary)return;
   if(!this.bagPhase&&!this.swinging&&!this.charging)this.orbit+=(event.clientX-this.dragStart)*.003;
   this.dragStart=event.clientX;
  });
  const stopDrag=event=>{if(event.isPrimary)this.dragging=false};
  window.addEventListener('pointerup',stopDrag);
  window.addEventListener('pointercancel',stopDrag);
 }
}
