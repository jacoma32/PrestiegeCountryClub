import {setHatFinish} from './gear-logos.js';
import {gearImage} from './gear-preview.js?v=putts1';
import {setBallFinish} from './golf-ball.js?v=brands1';
import {Match} from './match.js?v=friendflow1';
import {Clubhouse} from './clubhouse.js?v=party4';
import {poloTile} from './polo-patterns.js?v=playergear1';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {lightClubs} from './club-model.js?v=proshop1';
import * as THREE from 'three';
import {GolfGame} from './game.js?v=friendflow1';
import {SoundEngine} from './sound.js?v=settings1';
import {applyTextSize,readPreferences,savePreferences} from './preferences.js';
import {OnlineRoom,partyLimit} from './online.js?v=friendflow1';
import {FriendsService,isOnline} from './friends.js?v=friendflow1';
import {walletKey,wallet,catalog,gearSections,itemById,award,buy,wear,unequip,clubLoadout} from './locker.js?v=username1';
import {HoleMap} from './hole-map.js?v=shotpath2';
import {golfDevice,bindTouchGolf} from './device-controls.js?v=phonehud1';
import {loadPlayerSave,playerSave} from './player-save.js';
const $=id=>document.getElementById(id);
let account;
try {
 account = await loadPlayerSave();
} catch (error) {
 console.error('Player save unavailable', error);
 $('loader').classList.add('hidden');
 $('error').textContent = 'Your account save could not load. Reload to try again.';
 $('error').classList.remove('hidden');
 throw error;
}
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
const device=golfDevice();
const holeMap=new HoleMap($('holeMap'),$('holeMapCanvas'));
document.body.dataset.golfDevice=device.name;
document.body.classList.toggle('touch-golf',device.touch);
$('shotHelp').textContent=device.touch?'HOLD SWING FOR POWER · RELEASE TO HIT':'HOLD SPACE FOR POWER · RELEASE TO SWING';
$('openBag').textContent=device.touch?'Club bag':'C · CLUB BAG';
const renderer=new THREE.WebGLRenderer({antialias:!device.touch,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,device.touch?1.25:1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;$('viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,1100);const sun=new THREE.DirectionalLight(0xffe7c7,2.1);sun.position.set(-65,100,42);sun.castShadow=true;sun.shadow.mapSize.setScalar(device.touch?1024:2048);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.near=.5;sun.shadow.camera.far=320;sun.shadow.normalBias=.009;sun.shadow.bias=-.00012;scene.add(sun.target);scene.add(sun);scene.add(new THREE.HemisphereLight(0xc3e8ff,0x55513e,1.25));
lightClubs(renderer,new RoomEnvironment());
const game=new GolfGame(renderer,scene,camera),sound=new SoundEngine();game.touchControls=device.touch;
if(device.touch)bindTouchGolf(game,{swing:$('touchSwing'),left:$('touchAimLeft'),right:$('touchAimRight')});
game.onSfx=(event,detail)=>sound.play(event,detail);let page='home';
const activeUser=account;
const preview = document.querySelector('#golfer .preview');
const stage=$('lobbyStage'),lobby=new Clubhouse(game.golfer,stage,finishApparel);
function sizeCanvas() {
 const box = renderer.domElement.parentElement.getBoundingClientRect();
 if (!box.width || !box.height) return;
 camera.aspect = box.width / box.height;
 camera.updateProjectionMatrix();
 renderer.setSize(box.width, box.height);
}
new ResizeObserver(sizeCanvas).observe(preview);new ResizeObserver(sizeCanvas).observe(stage);
const showPage=id=>{if(id!=='playing'&&page==='playing'&&onlineActive)endOnline();if(page==='home')scene.add(game.golfer.root);page=id;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('selected',b.dataset.page===id));document.body.classList.toggle('is-playing',id==='playing');(id==='home'?stage:id==='golfer'?preview:$('viewport')).appendChild(renderer.domElement);sizeCanvas();if(id==='store'||id==='locker')renderGear();if(id!=='playing'){game.enterMenu();if(id==='golfer')game.enterPreview();if(id==='home'){lobby.enter();refreshTags();if(room.connected)room.send({type:'appearance',profile:playerCard()})}}};
const lessons=[
 ['WELCOME TO PRESTIGE','I’m Coach Timmy. Welcome to the club! I’ll show you how to set up, aim, swing and putt.','talk'],
 ['SET UP YOUR BALL','First, place your tee and ball. Watch me demonstrate the setup.','tee'],
 ['CHOOSE YOUR CLUB','The game starts you with a club for the distance to the pin. '+(device.touch?'Tap Club bag':'Press C or click Club Bag')+' to choose a different club. Use a driver for long shots, an iron for approaches, a wedge for short shots, and a putter on the green.','pointGesture'],
 ['AIM YOUR SHOT',(device.touch?'Tap the left and right arrows to aim.':'Press A or D, or use the left and right arrow keys to aim.')+' Keep the blue tracer on your target and check the wind before you swing.','point'],
 ['WATCH A FULL SWING',(device.touch?'Touch and hold Swing to build power.':'Hold Space to build power.')+' Release near the highlighted zone to hit the ball.','drive'],
 ['CHIPPING & PUTTING','Use your wedge around the green and the putter once you reach the putting surface. The putting grid arrows point downhill, and the distance to the cup is shown in feet.','chip'],
 ['YOU’RE READY','That’s the basics. Your golfer is ready. Play the hole, keep your score, and I’ll be here if you need a hand.','clap']
];let lessonIndex=0;
const renderLesson=()=>{const [title,body,action]=lessons[lessonIndex];$('coachTitle').textContent=title;$('coachText').textContent=body;$('coachProgress').textContent=`LESSON ${lessonIndex+1} / ${lessons.length}`;$('coachNext').textContent=lessonIndex===lessons.length-1?'START PLAYING →':'NEXT →';game.coachAction(action);sound.play('menu')};
const closeTutorial=()=>{$('tutorialOverlay').classList.add('hidden');try{localStorage.setItem('prestiege-v4-tutorial-done','yes')}catch{}};
const openTutorial=()=>{lessonIndex=0;$('tutorialOverlay').classList.remove('hidden');renderLesson()};
$('coachNext').onclick=()=>{if(++lessonIndex>=lessons.length)closeTutorial();else renderLesson()};$('coachSkip').onclick=closeTutorial;
const start=async(name='royal',tutorial=false,length=18)=>{
 showPage('playing');$('loader').classList.remove('hidden');try{await game.begin(name,tutorial,length);$('loader').classList.add('hidden');if(tutorial)openTutorial()}catch(e){$('loader').classList.add('hidden');$('error').textContent='Could not start round: '+e.message;$('error').classList.remove('hidden')}};
document.querySelectorAll('[data-page]:not(#playGolf)').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));
const playMode=$('playMode'),inviteMethod=$('inviteMethod'),invitePrompt=$('partyPrompt');
let selectedCourse='',selectedLength=18,checkingInvite=false,offeredInvite=null;
function chooseRound(button){
 selectedCourse=button.dataset.course;
 $('playModeCourse').textContent=button.querySelector('h3').textContent;
 $('playModeTitle').textContent='How many holes do you want to play?';
 $('roundLengths').hidden=false;
 $('playChoices').hidden=true;
 playMode.showModal();
}
async function openPlayGolf(){
 if(checkingInvite||playMode.open||invitePrompt.open)return;
 if(room.connected){showPage('home');return}
 checkingInvite=true;
 let timer;
 try{
  const invite=displayedInvite||await Promise.race([
   connectFriends().then(()=>friends.findInvite()).catch(()=>null),
   new Promise(resolve=>{timer=setTimeout(resolve,2500)}),
  ]);
  if(invite&&!room.connected&&!joiningInvite){
   offeredInvite=invite;
   $('partyMessage').textContent='Play golf with @'+invite.username+'?';
   invitePrompt.showModal();
  }else if(!room.connected&&!joiningInvite)showPage('courses');
 }finally{clearTimeout(timer);checkingInvite=false}
}
$('heroPlay').onclick=$('playGolf').onclick=openPlayGolf;
for(const button of document.querySelectorAll('[data-round-length]')){
 button.onclick=()=>{
  selectedLength=Number(button.dataset.roundLength);
  $('playModeTitle').textContent='Are you playing by yourself or with friends?';
  $('roundLengths').hidden=true;
  $('playChoices').hidden=false;
  $('playSolo').focus();
 };
}
$('playSolo').onclick=()=>{
 playMode.close();
 if(room.room)endOnline();
 start(selectedCourse,!localStorage.getItem('prestiege-v4-tutorial-done'),selectedLength);
};
$('playWithFriend').onclick=()=>{
 playMode.close();
 inviteMethod.showModal();
};
for(const button of document.querySelectorAll('[data-course]')){
 button.onclick=()=>chooseRound(button);
}
$('rangeTab').onclick=()=>{if(room.room)endOnline();start('range',false)};$('exitRound').onclick=()=>showPage('courses');$('toClubhouse').onclick=()=>showPage('courses');$('nextHole').onclick=()=>{if(!match)game.actionNext();else if(match.complete)showPage('home');else match.nextHole()};$('resetAim').onclick=()=>{game.aimDelta(-game.aim)};$('openBag').onclick=()=>{game.cancelCharge();game.openBag()};
$('closeBag').onclick=()=>game.returnFromBag(game.club);
$('bagContents').addEventListener('click',event=>{
 const button=event.target.closest('[data-pick]');
 if(button)game.returnFromBag(button.dataset.pick);
});
$('playing').addEventListener('pointermove',event=>{
 if(event.target.closest('button'))return;
 if(game.bagPhase==='select')game.highlightBagClub(game.clubUnderPointer(event));
});
$('playing').addEventListener('pointerleave',()=>game.highlightBagClub(null));
$('playing').addEventListener('click',event=>{
 if(event.target.closest('button'))return;
 const club=game.clubUnderPointer(event);if(club)game.returnFromBag(club);
});
document.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>game.setShape(b.dataset.shape));
const saved=playerSave() ? (playerSave().state.golfer || {}) : (()=>{try{return JSON.parse(localStorage.getItem('prestiege-golfer'))||{}}catch{return {}}})();$('golferName').value=saved.name||'ROOKIE';$('golferFrame').value=saved.frame||'male';$('shirtColor').value=saved.shirt||'#e9f0e9';$('hairColor').value=saved.hair||'#36261f';$('eyeColor').value=saved.eyes||'#4c8069';$('skinColor').value=saved.skin||'#ba8c70';$('pantsColor').value=saved.pants||'#1d3535';
const palette=()=>({shirt:$('shirtColor').value,pants:$('pantsColor').value,hair:$('hairColor').value,eyes:$('eyeColor').value,skin:$('skinColor').value});
function applyGear(){
 const {equipped}=wallet();
 setBallFinish(game.ball,itemById(equipped.ball));
 game.equipment={...clubLoadout(equipped),bag:equipped.bag,ball:equipped.ball};
 game.setBagFinish(itemById(equipped.bag),game.equipment);
 game.golfer.applyAppearance(palette());
 finishApparel(game.golfer,equipped.shirt,equipped.hat,game.equipment);
}
function finishApparel(actor,shirt,hat,clubs){
 finishShirt(actor,shirt);
 const cap=itemById(hat);
 if(actor.outfit?.cap)setHatFinish(actor.outfit.cap,cap?.slot==='hat'?cap:itemById('club-cap'));
 actor.setEquipmentFinish(clubLoadout(clubs));
}
function finishShirt(actor,id){
 const shirt=itemById(id)?.slot==='shirt'?itemById(id):itemById('custom');
 const fabric=actor.outfit?.shirt;
 if(!fabric)return;
 if(shirt.color)fabric.color.set(shirt.color);
 if(fabric.userData.finish===shirt.id)return;
 fabric.userData.finish=shirt.id;
 fabric.customProgramCacheKey=()=>shirt.pattern||'club-solid';
 fabric.onBeforeCompile=shader=>{
  if(!shirt.pattern)return;
  shader.uniforms.poloMask={value:poloTile(shirt.pattern).map};
  shader.vertexShader='varying vec2 poloUV;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n poloUV=vec2(position.x + 0.6*position.z,position.y)*12.0;');
  shader.fragmentShader='uniform sampler2D poloMask; varying vec2 poloUV;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float ink=texture2D(poloMask,poloUV).a;
   float lightness=dot(diffuse,vec3(.2126,.7152,.0722));
   vec3 thread=mix(vec3(.91,.89,.80),vec3(.045,.065,.06),smoothstep(.14,.45,lightness));
   diffuseColor.rgb=mix(diffuseColor.rgb,thread,ink*.78);`);
 };
 fabric.needsUpdate=true;
}
const gearPreviews=new IntersectionObserver(entries=>{
 for(const {target,isIntersecting} of entries){
  if(!isIntersecting)continue;
  const item=itemById(target.dataset.item);
  try{
   const src=gearImage(item,game.golfer,$('shirtColor').value,game.equippedFrame,finishShirt);
   if(src){
    const image=new Image();image.src=src;image.alt='';target.replaceChildren(image);
   }
  }catch(error){console.warn('Gear preview unavailable:',error)}
  gearPreviews.unobserve(target);
 }
},{rootMargin:'150px'});
const gearView={
 store:{slot:'shirt',brand:''},
 locker:{slot:'shirt',brand:''}
};
function renderGear(){
 const state=wallet();
 $('creditBalance').textContent=state.credits+' COINS';
 $('creditBalance').ariaLabel=state.credits+' coins. Open Pro Shop';
 if(page!=='store'&&page!=='locker')return;
 const view=page,list=$(view+'Items'),filters=$(view+'Categories');
 const filter=gearView[view],{slot}=filter;
 if(!filters.children.length){
  for(const [category,label] of Object.entries(gearSections)){
   const button=document.createElement('button');
   button.type='button';button.className='glass';button.dataset.category=category;button.textContent=label;
   button.onclick=()=>{Object.assign(filter,{slot:category,brand:''});$(view+'Status').textContent='';renderGear()};
   filters.append(button);
  }
 }
 for(const button of filters.children)button.setAttribute('aria-pressed',String(button.dataset.category===slot));
 gearPreviews.disconnect();
 list.replaceChildren();
 const items=catalog.filter(item=>item.slot===slot&&(view==='locker'?state.owned.includes(item.id):item.brand));
 const brandSelect=$(view+'Brand');
 const brands=[...new Set(items.map(item=>item.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 brandSelect.replaceChildren(new Option('All brands',''),...brands.map(brand=>new Option(brand,brand)));
 brandSelect.value=filter.brand;
 brandSelect.onchange=()=>{
  Object.assign(filter,{brand:brandSelect.value});renderGear();
 };
 const results=filter.brand?items.filter(item=>item.brand===filter.brand):items;
 $(view+'Count').textContent=results.length+` item${results.length===1?'':'s'}`;
 if(!results.length){
  const message=document.createElement('p');
  message.textContent='Visit the Pro Shop to add gear in this category.';
  list.append(message);
 }
 for(const item of results){
  const owned=state.owned.includes(item.id),wearing=state.equipped[slot]===item.id;
  const card=document.createElement('article'),preview=document.createElement('div');
  const name=document.createElement('strong'),brand=document.createElement('small'),action=document.createElement('button');
  card.className='gear-card';preview.className='gear-preview';
  preview.dataset.item=item.id;
  brand.textContent=item.brand||'Prestiege';
  name.append(brand,document.createTextNode(item.name));
  action.className='glass';action.type='button';
  const canReset=wearing&&['driver','wood','hybrid','wedges','putter'].includes(slot);
  if(canReset){
   const equippedTag=document.createElement('small');
   equippedTag.textContent='Equipped';
   name.append(equippedTag);
  }
  action.textContent=view==='locker'?(canReset?'Use club set':wearing?'Equipped':'Equip'):(owned?(item.price?'Owned':'In Locker'):'Buy · '+item.price+' coins');
  action.disabled=view==='locker'?wearing&&!canReset:owned||state.credits<item.price;
  action.setAttribute('aria-label',action.textContent+' · '+[item.brand,item.name].filter(Boolean).join(' '));
  action.onclick=async()=>{try{
   if(canReset)await unequip(slot);else if(view==='locker')await wear(item.id);else await buy(item.id);
   applyGear();
   if(view==='locker'&&room.connected)room.send({type:'appearance',profile:playerCard()});
   renderGear();$(view+'Status').textContent=canReset?'Using clubs from your equipped set.':[item.brand,item.name].filter(Boolean).join(' ')+(view==='locker'?' equipped.':' is in your Locker.');
  }catch(error){$(view+'Status').textContent=error.message}};
  card.append(preview,name,action);list.append(card);gearPreviews.observe(preview);
 }
}
game.onShotSettled=()=>{
 const session=match;
 if(session)queueMicrotask(()=>{if(match===session)session.strokeSettled()});
};
game.onHoleComplete=async(round,hole,shots)=>{
 const session=match;if(session)queueMicrotask(()=>{if(match===session)session.holed(shots)});
 const sameHole=()=>game.roundId===round&&game.index===hole&&game.modal;
 try{
  const coins=await award(round,hole,shots);
  renderGear();
  if(coins&&sameHole())$('roundDescription').append(' · +'+coins+' COINS');
 }catch{if(sameHole())$('roundDescription').append(' · Coins could not be saved on this browser.')}
};
window.addEventListener('storage',e=>{if(e.key===walletKey||e.key?.startsWith(walletKey+'-')){renderGear();applyGear()}});
renderGear();

async function equip(){const frame=$('golferFrame').value;$('animationStatus').textContent='LOADING GOLF ANIMATIONS…';const source=await game.prepareGolfer(frame);applyGear();renderGear();$('modelSource').textContent=source.toUpperCase();const ready=['idle','drive','chip','putt','walk','run','tee','pick'].filter(name=>game.golfer.actions.has(name)).length;$('animationStatus').textContent=ready===8?`8/8 GOLF ANIMATIONS READY · ${game.golfer.actions.size}/19 CLIPS LOADED`:`${ready}/8 GOLF ANIMATIONS · BUILT-IN SWING BACKUP`;return source}
$('saveGolfer').onclick=async()=>{const golfer={name:$('golferName').value.trim()||'ROOKIE',frame:$('golferFrame').value,...palette()};$('loader').classList.remove('hidden');try{const cloud=playerSave();if(cloud)await cloud.update(save=>{save.golfer=golfer});else localStorage.setItem('prestiege-golfer',JSON.stringify(golfer));await equip();$('loader').classList.add('hidden');showPage('home')}catch(e){$('loader').classList.add('hidden');$('error').textContent='Golfer could not load: '+e.message;$('error').classList.remove('hidden')}};
['shirtColor','pantsColor','hairColor','eyeColor','skinColor'].forEach(id=>$(id).addEventListener('input',()=>applyGear()));$('golferFrame').addEventListener('change',async()=>{$('golferFrame').disabled=true;$('loader').classList.remove('hidden');try{await equip()}catch(e){$('error').textContent='Golfer preview could not load: '+e.message;$('error').classList.remove('hidden')}finally{$('golferFrame').disabled=false;$('loader').classList.add('hidden')}});
const soundButton = $('soundBtn');
function showSoundPreference(enabled) {
 soundButton.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
 soundButton.setAttribute('aria-pressed', String(enabled));
}
function refreshPreferences() {
 const preferences = readPreferences();
 applyTextSize(preferences.textSize);
 if (!preferences.sound) sound.setEnabled(false);
 showSoundPreference(preferences.sound);
}
refreshPreferences();
window.addEventListener('pageshow', refreshPreferences);
window.addEventListener('storage', refreshPreferences);
function activatePreferredSound(event) {
 if (soundButton.contains(event.target) || soundButton.disabled || soundButton.getAttribute('aria-pressed') !== 'true' || sound.enabled) return;
 sound.setEnabled(true).catch(() => {});
}
window.addEventListener('click', activatePreferredSound, true);
window.addEventListener('keydown', activatePreferredSound, true);
soundButton.onclick = async () => {
 soundButton.disabled = true;
 const enabled = soundButton.getAttribute('aria-pressed') !== 'true';
 try {
  await sound.setEnabled(enabled, enabled);
  savePreferences({ sound: enabled });
  showSoundPreference(enabled);
 } catch {
  showSoundPreference(sound.enabled);
 } finally {
  soundButton.disabled = false;
 }
};

const onlinePanel=$('onlinePanel'),onlineStatus=$('onlineStatus'),onlineCode=$('onlineCode'),rivalStats=$('rivalStats');
let onlineActive=false,match=null;
let friendsReady=false,connectingFriends=null;
function playerCard(){
 const {equipped}=wallet();
 return {name:friends.profile?.username||activeUser?.username||$('golferName').value||'Rookie',frame:$('golferFrame').value,colors:palette(),pattern:equipped.shirt,hat:equipped.hat,clubs:equipped.clubs,clubStyles:clubLoadout(equipped)};
}
function refreshTags(){
 const name=playerCard().name;
 $('localName').textContent='@'+name;$('headerTag').textContent='@'+name;
 const party=room.connected;
 const course=Array.from(document.querySelectorAll('[data-course]')).find(button=>button.dataset.course===room.settings?.course);
 const round=course?course.querySelector('h3').textContent+' · '+room.settings.length+' HOLES · ':'';
 $('partyCount').textContent=round+Math.max(1,room.playerIds.length)+' / '+partyLimit+' GOLFERS';
 $('inviteFriend').hidden=!room.canInvite;$('leaveParty').hidden=!room.room;
 $('heroPlay').hidden=party;
 $('startFriendRound').hidden=room.role!=='host'||!party||room.inMatch;
 $('onlineJoin').disabled=party;
 $('createParty').hidden=!selectedCourse||Boolean(room.room);

 refreshInvite();

}
let displayedInvite=null,replyBusy=false,joiningInvite=false,inviteTimer;
function refreshInvite(){
 clearTimeout(inviteTimer);
 const incoming=friends.friends.find(friend=>friends.pendingInvite(friend));
 displayedInvite=!room.connected&&!joiningInvite?incoming:null;
 $('inviteDot').hidden=!displayedInvite;
 if(!displayedInvite)return;
 $('partyJoin').disabled=$('partyDecline').disabled=replyBusy;
 inviteTimer=setTimeout(refreshInvite,Math.max(1,displayedInvite.inviteTime.toMillis()+120000-Date.now()));
}
async function answerInvite(join){
 const invite=offeredInvite;
 if(replyBusy||!invite)return;
 replyBusy=true;$('partyJoin').disabled=$('partyDecline').disabled=true;
 try{
  const accepted=await friends.reply(invite,join?'joined':'declined');
  if(join&&accepted){
   joiningInvite=true;
   invitePrompt.close();
   if(room.role==='host')await friends.unhost().catch(()=>{});
   openPartyPanel('code');await room.join(invite.hosting);
  }else{
   invitePrompt.close();showPage('courses');
  }
 }catch(error){invitePrompt.close();openPartyPanel('friends');showFriendsError(error)}
 finally{
  offeredInvite=null;replyBusy=false;$('partyJoin').disabled=$('partyDecline').disabled=false;refreshInvite();
 }
}
$('partyJoin').onclick=()=>answerInvite(true);
$('partyDecline').onclick=()=>answerInvite(false);
invitePrompt.addEventListener('cancel',event=>{event.preventDefault();answerInvite(false)});
const friends=new FriendsService(()=>renderFriends());
const room=new OnlineRoom({
 profile:playerCard,
 onParty:(players,joined)=>{
  const profiles={};
  for(const [id,profile] of Object.entries(players)){
   if(id===room.id)continue;
   const colors={};for(const key of Object.keys(palette()))if(/^#[0-9a-f]{6}$/i.test(profile.colors?.[key]))colors[key]=profile.colors[key];
   profiles[id]={name:profile.name,frame:profile.frame==='female'?'female':'male',colors,pattern:profile.pattern,hat:profile.hat,clubs:clubLoadout({...profile.clubStyles,clubs:profile.clubs})};
  }
  lobby.setMembers(profiles,showFriendsError);
  if(joined){
   joiningInvite=false;onlinePanel.classList.add('hidden');if(page!=='home')showPage('home');
  }
  renderFriends();
 },
 onHosted:()=>renderFriends(),
 onStatus:message=>{if(!room.room||message.startsWith('Connection failed')||message.startsWith('Cannot join'))joiningInvite=false;refreshTags();onlineCode.hidden=$('onlineCopy').hidden=room.role!=='host'||!room.room;onlineStatus.textContent=message;onlineCode.textContent=room.role==='host'&&room.room?'ROOM CODE: '+room.room:'';},
 onStart:async (course,length,order,wind)=>{
  if(room.role==='host')friends.unhost().catch(()=>{});
  selectedCourse='';
  onlineActive=true;onlinePanel.classList.add('hidden');
  $('rivalName').textContent='FRIEND ROUND';rivalStats.hidden=false;document.body.classList.add('friend-round');
  const session=match=new Match(game,room,lobby,length,order,wind);
  await start(course,false,length);
  if(match===session&&game.started)session.start();
 },
 onState:state=>match?.receive(state),
 onDisconnect:()=>{
  if(match?.complete){joiningInvite=false;return}
  const wasPlaying=onlineActive;
  onlineActive=false;match?.stop();match=null;joiningInvite=false;lobby.setMembers({},showFriendsError);renderFriends();
  rivalStats.hidden=true;document.body.classList.remove('friend-round');
  if(wasPlaying){showPage('home');onlinePanel.classList.remove('hidden');onlineStatus.textContent='Your friend disconnected. The match has ended.'}
 }
});
function endOnline(){onlineActive=false;match?.stop();match=null;rivalStats.hidden=true;document.body.classList.remove('friend-round');room.close();friends.unhost().catch(()=>{})}
function renderFriends(){
 $('friendCount').textContent=friendsReady?' / '+friends.friends.length:'';refreshTags();const login=$('friendsLogin'),content=$('friendsContent'),status=$('onlineStatus'),list=$('friendsList'),inbox=$('friendsInbox');
 if(!friendsReady){login.hidden=false;content.hidden=true;return}
 if(!friends.profile?.username){login.hidden=false;content.hidden=true;status.textContent='Choose a unique online username for this browser.';return}
 login.hidden=true;content.hidden=false;$('friendsMe').textContent='SIGNED IN AS @'+friends.profile.username;
 inbox.replaceChildren();
 for(const request of friends.requests){
  const item=document.createElement('div');item.className='friend-row';
  const label=document.createElement('span');label.textContent='@'+request.fromName+' sent a friend request';
  const yes=document.createElement('button');yes.textContent='ACCEPT';yes.onclick=()=>friends.accept(request.id).catch(showFriendsError);
  const no=document.createElement('button');no.textContent='DECLINE';no.onclick=()=>friends.reject(request.id).catch(showFriendsError);
  item.append(label,yes,no);inbox.append(item);
 }
 if(!friends.requests.length)inbox.textContent='No pending requests';
 list.replaceChildren();
 for(const friend of friends.friends){
  const item=document.createElement('div');item.className='friend-row';
  const name=document.createElement('span');name.textContent='@'+friend.username+' · '+(isOnline(friend)?friend.hosting?'IN LOBBY':'ONLINE':'OFFLINE');
  item.append(name);
  if(room.canInvite&&room.peer?.open&&!joiningInvite&&!Object.values(room.players).some(player=>player.name.toLowerCase()===friend.username.toLowerCase())){
   const invite=document.createElement('button');const outgoing=friends.profile.invited===friend.uid&&friends.profile.hosting===room.room&&room.room&&room.role==='host'&&Date.now()-friends.profile.inviteTime?.toMillis?.()<120000;
   const declined=outgoing&&friend.partyReplies?.[friends.user.uid]?.id===friends.profile.inviteId&&friend.partyReplies[friends.user.uid].answer==='declined';
   invite.textContent=declined?'Invite again':outgoing?'Invite sent':'Invite to party';invite.disabled=!!outgoing&&!declined;
   if(declined)name.textContent+=' · Declined';
   invite.onclick=async()=>{
    invite.disabled=true;
    try{await friends.host(room.room,room.settings.course,friend.uid);onlineStatus.textContent='Invite sent to @'+friend.username+'. They can accept from Play Golf.'}
    catch(error){showFriendsError(error);invite.disabled=false}
   };item.append(invite);
  }
  list.append(item);
 }
 if(!friends.friends.length)list.textContent='Your friends will appear here';
}
function showFriendsError(error){onlineStatus.textContent=error.message||String(error)}
function openPartyPanel(mode){
 onlinePanel.dataset.mode=mode;
 $('createParty').hidden=!selectedCourse||Boolean(room.room);
 onlinePanel.classList.remove('hidden');
 $('inviteOptions').open=mode==='code';
}
async function openFriends(){
 openPartyPanel('friends');
 try{
  await connectFriends()
  renderFriends();if(onlinePanel.dataset.mode!=='friends')return;
  onlineStatus.textContent=friends.profile?.username?'Search for a gamertag or invite a friend.':'Choose your online username';
 }catch(error){if(onlinePanel.dataset.mode==='friends')onlineStatus.textContent='Friends list unavailable. You can use a party code from Play Golf.';friendsReady=false}
}
$('friendsRegister').onclick=async()=>{try{await friends.register($('friendsUsername').value);renderFriends();onlineStatus.textContent='Username registered — add your first friend!'}catch(error){showFriendsError(error)}};
$('friendsSearch').addEventListener('keydown',event=>{if(event.key==='Enter')$('friendsAdd').click()});
$('friendsAdd').onclick=async()=>{try{const name=await friends.sendRequest($('friendsSearch').value);onlineStatus.textContent='Friend request sent to @'+name}catch(error){showFriendsError(error)}};
$('onlineOpen').onclick=()=>{showPage('home');openFriends()};
$('onlineClose').onclick=()=>onlinePanel.classList.add('hidden');
function connectFriends(){
 if(!connectingFriends)connectingFriends=friends.init().then(()=>{friendsReady=true;renderFriends()}).catch(err=>{connectingFriends=null;throw err});
 return connectingFriends;
}
async function hostParty(){
 if(room.role==='host'&&room.room){room.configure(selectedCourse,selectedLength);return}
 if(selectedCourse)await room.host(selectedCourse,selectedLength);
}
$('homeRange').onclick=()=>$('rangeTab').click();
$('inviteFriend').onclick=()=>{if(room.canInvite)inviteMethod.showModal();else openFriends()};
$('startFriendRound').onclick=()=>room.beginRound();
$('inviteViaFriends').onclick=()=>{
 inviteMethod.close();
 openFriends();
 hostParty();
};
$('inviteViaCode').onclick=()=>{
 inviteMethod.close();
 openPartyPanel('code');
 hostParty();
};
$('leaveParty').onclick=()=>{endOnline();refreshTags()};
$('createParty').onclick=()=>hostParty();
$('onlineJoin').onclick=()=>room.join($('onlineJoinCode').value);
$('onlineCopy').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('party',room.room);try{await navigator.clipboard.writeText(url.href);onlineStatus.textContent='Invite link copied'}catch{onlineStatus.textContent=url.href}};
const inviteCode=new URL(location.href).searchParams.get('party');
if(/^[A-Z0-9]{6}$/i.test(inviteCode||'')){openPartyPanel('code');$('onlineJoinCode').value=inviteCode;onlineStatus.textContent='You have a clubhouse invitation. Select Join Party.'}
const sunOffset=new THREE.Vector3(-39,53,27);
function loop(){requestAnimationFrame(loop);const dt=Math.min(game.clock.getDelta(),.05);if(page==='home'){lobby.draw(renderer,dt);return}if(match)match.update(dt);else game.update(dt);const course=game.world.current;
 if(sun.userData.course!==course){
  sun.userData.course=course;
  const settings=course==='dunes'?[-45,38,26,0xffddaa,2.14]:course==='misty'?[-24,12,-64,0xffbb85,1.75]:course==='ocean'?[-48,34,16,0xffe4bc,2.15]:course==='summit'?[29,55,-38,0xfff2df,2.02]:[-39,43,27,0xffdfb3,2.08];
  sunOffset.set(settings[0],settings[1],settings[2]);sun.color.setHex(settings[3]);sun.intensity=settings[4];
 }
 holeMap.update(game,page==='playing');
 if(game.world.puttGrid)game.world.puttGrid.visible=page==='playing'&&game.started&&(game.spectating
  ? match?.frame?.putting===true
  : game.club==='putter'&&!game.swinging&&!game.bagPhase&&!game.modal);
 const lightTarget=game.spectating?game.ball.position:game.position;
 sun.target.position.copy(lightTarget);sun.position.copy(lightTarget).add(sunOffset);renderer.render(scene,camera)}window.addEventListener('resize',sizeCanvas);showPage('home');connectFriends().catch(()=>{});loop();
window.dispatchEvent(new Event('pcc-game-ready'));
(async()=>{$('loader').classList.add('hidden');refreshTags();try{await equip()}catch(e){console.warn('Golfer preview unavailable:',e);$('modelSource').textContent='MODEL WILL LOAD WHEN ASSETS ARE AVAILABLE'}})();
