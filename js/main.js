import {setHatFinish} from './gear-logos.js';
import {gearImage} from './gear-preview.js?v=clubs1';
import {setBallFinish} from './golf-ball.js?v=brands1';
import {Match} from './match.js?v=clubs1';
import {Clubhouse} from './clubhouse.js?v=clubs1';
import {poloTile} from './polo-patterns.js?v=playergear1';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {lightClubs} from './club-model.js?v=proshop1';
import * as THREE from 'three';
import {GolfGame} from './game.js?v=clubs1';
import {SoundEngine} from './sound.js?v=strikefield';
import {OnlineRoom} from './online.js?v=vote1';
import {FriendsService,isOnline} from './friends.js?v=invite2';
import {walletKey,wallet,catalog,gearSections,itemById,award,buy,wear,unequip,clubLoadout} from './locker.js?v=clubs1';
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;$('viewport').appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,1100);const sun=new THREE.DirectionalLight(0xffe7c7,2.1);sun.position.set(-65,100,42);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.near=.5;sun.shadow.camera.far=320;sun.shadow.normalBias=.009;sun.shadow.bias=-.00012;scene.add(sun.target);scene.add(sun);scene.add(new THREE.HemisphereLight(0xc3e8ff,0x55513e,1.25));
lightClubs(renderer,new RoomEnvironment());
const game=new GolfGame(renderer,scene,camera),sound=new SoundEngine();game.onSfx=(event,detail)=>sound.play(event,detail);let page='home',accountMode='create',activeUser=null;
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
const showError=msg=>{$('accountFeedback').textContent=msg;$('accountFeedback').classList.remove('hidden')};
const hex=bytes=>Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
async function hashPassword(password){if(!globalThis.crypto?.subtle)throw new Error('Secure sign-in requires HTTPS. Open the published GitHub Pages website.');const bytes=new TextEncoder().encode(password);return hex(await crypto.subtle.digest('SHA-256',bytes))}
function readAccount(){try{return JSON.parse(localStorage.getItem('prestiege-account')||'null')}catch{return null}}
function enterClub(user){activeUser=user;$('accountGate').classList.add('hidden');document.body.classList.remove('gated');$('accountBtn').textContent=user.username.toUpperCase();const saved=(()=>{try{return JSON.parse(localStorage.getItem('prestiege-golfer'))||null}catch{return null}})();if(!saved){showPage('golfer');game.enterPreview()}else showPage('home')}
window.addEventListener('pcc-account-ready',event=>enterClub(event.detail));
$('accountBtn').onclick=()=>{$('accountGate').classList.remove('hidden');document.body.classList.add('gated');window.dispatchEvent(new CustomEvent('pcc-account-mode',{detail:readAccount()?'signin':'create'}))};
const lessons=[
 ['WELCOME TO PRESTIEGE','I’m Coach Timmy. Welcome to the club! I’ll show you how to set up, aim, swing and putt.','talk'],
 ['SET UP YOUR BALL','First, place your tee and ball. Watch me demonstrate the setup.','tee'],
 ['CHOOSE YOUR CLUB','Press C to walk to your bag. Click a labeled club to take it back to the ball. The driver is for long tee shots. Irons cover approach shots, wedges are for short shots, and the putter is for the green.','pointGesture'],
 ['AIM YOUR SHOT','Use A / D or the arrow keys to aim. Keep the blue tracer on your target and check the wind before you swing.','point'],
 ['WATCH A FULL SWING','Hold SPACE to build power, then release near the highlighted timing zone. Watch the golfer complete the full swing before the camera follows the ball.','drive'],
 ['CHIPPING & PUTTING','Use your wedge around the green and the putter once you reach the putting surface. I’ll demonstrate both.','chip'],
 ['YOU’RE READY','That’s the basics. Your golfer is ready. Play the hole, keep your score, and I’ll be here if you need a hand.','clap']
];let lessonIndex=0;
const renderLesson=()=>{const [title,body,action]=lessons[lessonIndex];$('coachTitle').textContent=title;$('coachText').textContent=body;$('coachProgress').textContent=`LESSON ${lessonIndex+1} / ${lessons.length}`;$('coachNext').textContent=lessonIndex===lessons.length-1?'START PLAYING →':'NEXT →';game.coachAction(action);sound.play('menu')};
const closeTutorial=()=>{$('tutorialOverlay').classList.add('hidden');try{localStorage.setItem('prestiege-v4-tutorial-done','yes')}catch{}};
const openTutorial=()=>{lessonIndex=0;$('tutorialOverlay').classList.remove('hidden');renderLesson()};
$('coachNext').onclick=()=>{if(++lessonIndex>=lessons.length)closeTutorial();else renderLesson()};$('coachSkip').onclick=closeTutorial;
const start=async(name='royal',tutorial=false)=>{
 if(room.connected&&!room.inMatch){
  showPage('home');room.beginVote();return;
 }
 showPage('playing');$('loader').classList.remove('hidden');try{await game.begin(name,tutorial);$('loader').classList.add('hidden');if(tutorial)openTutorial()}catch(e){$('loader').classList.add('hidden');$('error').textContent='Could not start round: '+e.message;$('error').classList.remove('hidden')}};
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('heroPlay').onclick=()=>{if(room.connected){room.beginVote();return}if(!localStorage.getItem('prestiege-v4-tutorial-done'))start('royal',true);else showPage('courses')};document.querySelectorAll('[data-course]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.course,!localStorage.getItem('prestiege-v4-tutorial-done'))));$('rangeTab').onclick=()=>start('range',false);$('exitRound').onclick=()=>showPage('courses');$('toClubhouse').onclick=()=>showPage('courses');$('nextHole').onclick=()=>{if(!match)game.actionNext();else if(match.complete)showPage('home');else match.nextHole()};$('resetAim').onclick=()=>{game.aimDelta(-game.aim)};$('openBag').onclick=()=>game.openBag();
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
const saved=(()=>{try{return JSON.parse(localStorage.getItem('prestiege-golfer'))||{}}catch{return {}}})();$('golferName').value=saved.name||'ROOKIE';$('golferFrame').value=saved.frame||'male';$('shirtColor').value=saved.shirt||'#e9f0e9';$('hairColor').value=saved.hair||'#36261f';$('eyeColor').value=saved.eyes||'#4c8069';$('skinColor').value=saved.skin||'#ba8c70';$('pantsColor').value=saved.pants||'#1d3535';
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
 $('creditBalance').textContent=state.credits+' CREDITS';
 $('creditBalance').ariaLabel=state.credits+' credits. Open Pro Shop';
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
  action.textContent=view==='locker'?(canReset?'Use club set':wearing?'Equipped':'Equip'):(owned?(item.price?'Owned':'In Locker'):'Buy · '+item.price+' credits');
  action.disabled=view==='locker'?wearing&&!canReset:owned||state.credits<item.price;
  action.setAttribute('aria-label',action.textContent+' · '+[item.brand,item.name].filter(Boolean).join(' '));
  action.onclick=async()=>{try{
   if(canReset)unequip(slot);else if(view==='locker')wear(item.id);else await buy(item.id);
   applyGear();
   if(view==='locker'&&room.connected)room.send({type:'appearance',profile:playerCard()});
   renderGear();$(view+'Status').textContent=canReset?'Using clubs from your equipped set.':[item.brand,item.name].filter(Boolean).join(' ')+(view==='locker'?' equipped.':' is in your Locker.');
  }catch(error){$(view+'Status').textContent=error.message}};
  card.append(preview,name,action);list.append(card);gearPreviews.observe(preview);
 }
}
game.onHoleComplete=async(round,hole,shots)=>{
 const session=match;if(session)queueMicrotask(()=>{if(match===session)session.holed(shots)});
 const sameHole=()=>game.roundId===round&&game.index===hole&&game.modal;
 try{
  const credits=await award(round,hole,shots);
  renderGear();
  if(credits&&sameHole())$('roundDescription').append(' · +'+credits+' CREDITS');
 }catch{if(sameHole())$('roundDescription').append(' · Credits could not be saved on this browser.')}
};
window.addEventListener('storage',e=>{if(e.key===walletKey||e.key?.startsWith(walletKey+'-')){renderGear();applyGear()}});
renderGear();

async function equip(){const frame=$('golferFrame').value;$('animationStatus').textContent='LOADING GOLF ANIMATIONS…';const source=await game.prepareGolfer(frame);applyGear();renderGear();$('modelSource').textContent=source.toUpperCase();const ready=['idle','drive','chip','putt','walk','run','tee','pick'].filter(name=>game.golfer.actions.has(name)).length;$('animationStatus').textContent=ready===8?`8/8 GOLF ANIMATIONS READY · ${game.golfer.actions.size}/19 CLIPS LOADED`:`${ready}/8 GOLF ANIMATIONS · BUILT-IN SWING BACKUP`;return source}
$('saveGolfer').onclick=async()=>{const golfer={name:$('golferName').value.trim()||'ROOKIE',frame:$('golferFrame').value,...palette()};localStorage.setItem('prestiege-golfer',JSON.stringify(golfer));$('loader').classList.remove('hidden');try{await equip();$('loader').classList.add('hidden');showPage('home')}catch(e){$('loader').classList.add('hidden');$('error').textContent='Golfer could not load: '+e.message;$('error').classList.remove('hidden')}};
['shirtColor','pantsColor','hairColor','eyeColor','skinColor'].forEach(id=>$(id).addEventListener('input',()=>applyGear()));$('golferFrame').addEventListener('change',async()=>{$('golferFrame').disabled=true;$('loader').classList.remove('hidden');try{await equip()}catch(e){$('error').textContent='Golfer preview could not load: '+e.message;$('error').classList.remove('hidden')}finally{$('golferFrame').disabled=false;$('loader').classList.add('hidden')}});
$('soundBtn').onclick=async()=>{const on=await sound.toggle();$('soundBtn').textContent=on?'SOUND ON':'SOUND OFF'};

const onlinePanel=$('onlinePanel'),onlineStatus=$('onlineStatus'),onlineCode=$('onlineCode'),rivalStats=$('rivalStats');
let onlineActive=false,match=null;
let friendsReady=false,connectingFriends=null,inviteTo=null;
function playerCard(){
 const {equipped}=wallet();
 return {name:friends.profile?.username||activeUser?.username||$('golferName').value||'Rookie',frame:$('golferFrame').value,colors:palette(),pattern:equipped.shirt,hat:equipped.hat,clubs:equipped.clubs,clubStyles:clubLoadout(equipped)};
}
function refreshTags(){
 const name=playerCard().name;
 $('localName').textContent='@'+name;$('headerTag').textContent='@'+name;
 const party=!!room.remoteName;$('partyCount').textContent='PARTY · '+(party?'2':'1')+' / 2';
 $('inviteFriend').hidden=party;$('leaveParty').hidden=!room.room;
 $('heroPlay').hidden=party;
 $('onlineJoin').disabled=$('createParty').disabled=party;
 $('multiplayer').querySelector('span').textContent=party?'Vote for course →':'Party play →';
 refreshInvite();

}
let displayedInvite=null,replyBusy=false,joiningInvite=false,inviteTimer;
function refreshInvite(){
 clearTimeout(inviteTimer);
 const incoming=friends.friends.find(friend=>friends.pendingInvite(friend));
 displayedInvite=!room.connected&&!joiningInvite?incoming:null;
 $('inviteDot').hidden=!displayedInvite;
 $('partyPrompt').hidden=!displayedInvite;
 if(!displayedInvite)return;
 $('partyMessage').textContent='@'+displayedInvite.username+' invited you to their party.'+(page==='playing'?' Joining leaves this round.':'');
 $('partyJoin').disabled=$('partyDecline').disabled=replyBusy;
 inviteTimer=setTimeout(refreshInvite,Math.max(1,displayedInvite.inviteTime.toMillis()+120000-Date.now()));
}
async function answerInvite(join){
 const invite=displayedInvite;
 if(replyBusy||!invite)return;
 replyBusy=true;refreshInvite();
 try{
  const accepted=await friends.reply(invite,join?'joined':'declined');
  if(join&&accepted){
   joiningInvite=true;
   if(room.role==='host')await friends.unhost();
   onlinePanel.classList.remove('hidden');
   await room.join(invite.hosting,playerCard().name);
  }
 }catch(error){onlinePanel.classList.remove('hidden');showFriendsError(error)}
 finally{replyBusy=false;refreshInvite()}
}
$('partyJoin').onclick=()=>answerInvite(true);
$('partyDecline').onclick=()=>answerInvite(false);
const friends=new FriendsService(()=>renderFriends());
const room=new OnlineRoom({
 profile:playerCard,
 onVote:ballot=>{
  const dialog=$('courseVote');
  if(!ballot){if(dialog.open)dialog.close();return}
  onlinePanel.classList.add('hidden');
  if(!dialog.open)dialog.showModal();
  const picked=ballot[room.role],other=ballot[room.role==='host'?'guest':'host'];
  $('cancelVote').textContent=picked?'Leave party':'Back to lobby';
  for(const button of dialog.querySelectorAll('[data-vote]')){
   button.disabled=!!picked;button.setAttribute('aria-pressed',String(button.dataset.vote===picked));
  }
  $('voteStatus').textContent=picked?(other?'Votes are in.':'Vote locked. Waiting for @'+room.remoteName+'…'):(other?'Your friend has voted. Choose your course.':'Choose your course.');
 },
 onParty:(profile,joined)=>{
  const colors={};for(const key of Object.keys(palette()))if(/^#[0-9a-f]{6}$/i.test(profile.colors?.[key]))colors[key]=profile.colors[key];
  lobby.member({name:room.remoteName,frame:profile.frame==='female'?'female':'male',colors,pattern:profile.pattern,hat:profile.hat,clubs:clubLoadout({...profile.clubStyles,clubs:profile.clubs})}).catch(showFriendsError);
  if(joined){joiningInvite=false;onlinePanel.classList.add('hidden');if(page!=='home')showPage('home');if(room.role==='host')friends.unhost().catch(showFriendsError)}
  renderFriends();
 },
 onHosted:(code,course)=>friends.host(code,course,inviteTo).then(()=>{onlineStatus.textContent=inviteTo?'Party invite sent.':'Party open. Share the invite link or code.'}).catch(err=>onlineStatus.textContent=err.message),
 onStatus:message=>{if(!room.room||message.startsWith('Connection failed')||message.startsWith('Cannot join'))joiningInvite=false;refreshTags();onlineCode.hidden=$('onlineCopy').hidden=room.role!=='host'||!room.room;onlineStatus.textContent=message;onlineCode.textContent=room.role==='host'&&room.room?'ROOM CODE: '+room.room:'';},
 onStart:async(course,opponent)=>{
  onlineActive=true;onlinePanel.classList.add('hidden');
  $('rivalName').textContent=opponent.toUpperCase();rivalStats.hidden=false;
  const session=match=new Match(game,room,lobby);
  await start(course,false);
  if(match===session&&game.started)session.start();
 },
 onState:state=>match?.receive(state),
 onDisconnect:()=>{
  if(match?.complete){joiningInvite=false;return}
  const wasPlaying=onlineActive;
  onlineActive=false;match?.stop();match=null;joiningInvite=false;lobby.member(null);renderFriends();
  rivalStats.hidden=true;
  if(wasPlaying){showPage('home');onlinePanel.classList.remove('hidden');onlineStatus.textContent='Your friend disconnected. The match has ended.'}
 }
});
function endOnline(){onlineActive=false;match?.stop();match=null;rivalStats.hidden=true;room.close();friends.unhost().catch(()=>{})}
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
  if(!room.connected&&!joiningInvite){
   const invite=document.createElement('button');const outgoing=friends.profile.invited===friend.uid&&friends.profile.hosting===room.room&&room.room&&room.role==='host'&&Date.now()-friends.profile.inviteTime?.toMillis?.()<120000;
   const declined=outgoing&&friend.partyReplies?.[friends.user.uid]?.id===friends.profile.inviteId&&friend.partyReplies[friends.user.uid].answer==='declined';
   invite.textContent=declined?'Invite again':outgoing?'Invite sent':'Invite to party';invite.disabled=!!outgoing&&!declined;
   if(declined)name.textContent+=' · Declined';
   invite.onclick=()=>hostParty(friend.uid);item.append(invite);
  }
  if(!room.connected&&friend.hosting&&isOnline(friend)&&!friend.invited){
   const join=document.createElement('button');join.textContent=friend.invited?'ACCEPT INVITE':'JOIN PARTY';
   join.onclick=()=>room.join(friend.hosting,friends.profile.username);
   item.append(join);
  }
  list.append(item);
 }
 if(!friends.friends.length)list.textContent='Your friends will appear here';
}
function showFriendsError(error){onlineStatus.textContent=error.message||String(error)}
async function openFriends(){
 onlinePanel.classList.remove('hidden');
 try{
  await connectFriends()
  renderFriends();onlineStatus.textContent=friends.profile?.username?'Search for a gamertag or invite a friend.':'Choose your online username';
 }catch(error){onlineStatus.textContent='Friends list unavailable. You can still create an invite link or join by code.';friendsReady=false}
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
async function hostParty(uid=null){
 if(room.connected)return;
 inviteTo=uid;
 if(room.role==='host'&&!room.peer?.open&&room.peer&&!room.peer.destroyed&&!room.peer.disconnected)return;
 if(room.role==='host'&&room.peer?.open){
  try{await friends.host(room.room,null,uid);onlineStatus.textContent=uid?'Party invite sent':'Party is open'}catch(e){showFriendsError(e)}
 }else await room.host(null,playerCard().name);
}
$('homeRange').onclick=()=>$('rangeTab').click();
$('inviteFriend').onclick=openFriends;
$('multiplayer').onclick=()=>room.connected?room.beginVote():openFriends();
$('cancelVote').onclick=()=>{
 if(room.ballot?.[room.role]){endOnline();$('courseVote').close()}else room.cancelVote();
};
$('courseVote').addEventListener('cancel',event=>{event.preventDefault();room.cancelVote()});
for(const button of document.querySelectorAll('[data-vote]'))button.onclick=()=>room.vote(button.dataset.vote);
$('leaveParty').onclick=()=>{endOnline();refreshTags()};
$('createParty').onclick=()=>hostParty();
$('onlineJoin').onclick=()=>room.join($('onlineJoinCode').value,playerCard().name);
$('onlineCopy').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('party',room.room);try{await navigator.clipboard.writeText(url.href);onlineStatus.textContent='Invite link copied'}catch{onlineStatus.textContent=url.href}};
const inviteCode=new URL(location.href).searchParams.get('party');
if(/^[A-Z0-9]{6}$/i.test(inviteCode||'')){$('inviteOptions').open=true;$('onlineJoinCode').value=inviteCode;onlinePanel.classList.remove('hidden');onlineStatus.textContent='You have a clubhouse invitation. Select Join Party.'}
const sunOffset=new THREE.Vector3(-39,53,27);
function loop(){requestAnimationFrame(loop);const dt=Math.min(game.clock.getDelta(),.05);if(page==='home'){lobby.draw(renderer,dt);return}if(match)match.update(dt);else game.update(dt);const course=game.world.current;
 if(sun.userData.course!==course){
  sun.userData.course=course;
  const settings=course==='misty'?[-24,12,-64,0xffbb85,1.75]:course==='ocean'?[-48,34,16,0xffe4bc,2.15]:course==='summit'?[29,55,-38,0xfff2df,2.02]:[-39,43,27,0xffdfb3,2.08];
  sunOffset.set(settings[0],settings[1],settings[2]);sun.color.setHex(settings[3]);sun.intensity=settings[4];
 }
 sun.target.position.copy(game.position);sun.position.copy(game.position).add(sunOffset);renderer.render(scene,camera)}window.addEventListener('resize',sizeCanvas);showPage('home');connectFriends().catch(()=>{});loop();
window.dispatchEvent(new Event('pcc-game-ready'));
(async()=>{$('loader').classList.add('hidden');const account=readAccount();if(account){activeUser=account;$('accountBtn').textContent=account.username.toUpperCase()}$('accountGate').classList.add('hidden');document.body.classList.remove('gated');refreshTags();try{await equip()}catch(e){console.warn('Golfer preview unavailable:',e);$('modelSource').textContent='MODEL WILL LOAD WHEN ASSETS ARE AVAILABLE'}})();
