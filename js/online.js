// The room host owns the roster and relays PeerJS messages to the other golfers.
const courses = ['royal', 'ocean', 'summit', 'misty', 'dunes'];
export const partySlots = ['host', 'guest1', 'guest2', 'guest3'];
export const partyLimit = partySlots.length;
const protocol = 4;
const cleanProfile = profile => typeof profile?.name === 'string'
 ? {...profile,name:profile.name.trim().slice(0,22)||'Friend'} : null;

export class OnlineRoom {
 constructor(callbacks) {
  Object.assign(this,callbacks);
  this.connections=new Map();
  this.players={};
  this.generation=0;
  this.cleanup();
 }

 get playerIds(){return partySlots.filter(id=>Object.hasOwn(this.players,id))}
 get connected(){return this.playerIds.length>=2}
 get canInvite(){return this.role==='host'&&this.connections.size<partyLimit-1&&!this.inMatch}
 status(message){this.onStatus?.(message)}

 async peerClass(){
  const module=await import('https://cdn.jsdelivr.net/npm/peerjs@1.5.5/+esm');
  return module.Peer||module.default;
 }

 cleanup(){
  this.generation++;
  clearTimeout(this.joinTimer);
  const peer=this.peer, connections=[...this.connections.values()];
  this.peer=null;this.connections.clear();this.players={};
  this.role='';this.id='';this.room='';this.settings=null;this.inMatch=false;
  for(const connection of connections)connection.close();
  peer?.destroy();
 }

 close(message='Disconnected'){
  const active=!!this.room;
  this.cleanup();
  if(active)this.onDisconnect?.();
  this.status(message);
 }

 async host(course,length=18){
  if(!courses.includes(course))return;
  this.cleanup();
  const generation=this.generation;
  this.role=this.id='host';
  this.settings={course,length:length===9?9:18};
  this.players.host=cleanProfile(this.profile());
  this.room=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[n%36]).join('');
  this.status('Connecting to matchmaking server…');
  try{
   const Peer=await this.peerClass();
   if(generation!==this.generation)return;
   const peer=this.peer=new Peer('pcc-room-'+this.room.toLowerCase(),{debug:0});
   peer.on('open',()=>{
    if(peer!==this.peer)return;
    this.status('Party open. Invite up to three friends.');
    this.onHosted?.(this.room,course);
   });
   peer.on('connection',connection=>{
    if(peer!==this.peer){connection.close();return}
    if(!this.canInvite){
     connection.on('open',()=>{
      this.write(connection,{type:'error',message:this.inMatch?'This party has already started.':'Room full.'});
      setTimeout(()=>connection.close(),2000);
     });
     return;
    }
    const id=partySlots.slice(1).find(slot=>!this.connections.has(slot));
    this.attach(id,connection);
   });
   peer.on('error',error=>{if(peer===this.peer)this.close('Connection failed: '+error.message)});
   peer.on('disconnected',()=>{if(peer===this.peer)this.status('Signaling lost — current party may continue')});
  }catch(error){if(generation===this.generation)this.close('Cannot start multiplayer: '+error.message)}
 }

 async join(code){
  this.cleanup();
  const room=code.trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(room)){this.status('Enter a six-character room code');return}
  this.role='guest';this.room=room;
  const generation=this.generation;
  this.status('Joining '+room+'…');
  this.joinTimer=setTimeout(()=>{
   if(generation===this.generation&&!this.connected)this.close('Could not reach the host. Check the code and try again.');
  },30000);
  try{
   const Peer=await this.peerClass();
   if(generation!==this.generation)return;
   const peer=this.peer=new Peer(undefined,{debug:0});
   peer.on('open',()=>{
    if(peer===this.peer)this.attach('host',peer.connect('pcc-room-'+room.toLowerCase(),{reliable:true}));
   });
   peer.on('error',error=>{if(peer===this.peer)this.close('Connection failed: '+error.message)});
  }catch(error){if(generation===this.generation)this.close('Cannot join: '+error.message)}
 }

 attach(id,connection){
  this.connections.set(id,connection);
  const current=()=>this.connections.get(id)===connection;
  const timeout=setTimeout(()=>{if(current()&&!this.players[id])connection.close()},30000);
  connection.on('open',()=>{
   if(current()&&this.role==='guest')this.write(connection,{type:'hello',protocol,profile:this.profile()});
  });
  connection.on('data',data=>{
   if(!current()||!data||typeof data!=='object')return;
   if(this.role==='host')this.fromGuest(id,data);
   else this.fromHost(data);
  });
  connection.on('close',()=>{
   clearTimeout(timeout);
   if(!current())return;
   this.connections.delete(id);
   if(this.role==='guest'||this.inMatch){this.close(this.inMatch?'A golfer disconnected. The match has ended.':'The host left the party.');return}
   if(!this.players[id])return;
   delete this.players[id];
   this.publishRoster();
   this.status('A golfer left the party.');
  });
  connection.on('error',()=>{if(current())connection.close()});
 }

 fromGuest(id,data){
  if(data.type==='hello'&&!this.players[id]){
   const profile=cleanProfile(data.profile);
   if(data.protocol!==protocol||!profile||this.inMatch){
    this.write(this.connections.get(id),{type:'error',message:'Unable to join. Refresh the game or ask the host for a new invite.'});
    return;
   }
   this.players[id]=profile;
   this.publishRoster(true);
   return;
  }
  if(!this.players[id])return;
  if(data.type==='appearance'){
   const profile=cleanProfile(data.profile);
   if(profile){this.players[id]=profile;this.publishRoster()}
  }else if(data.type==='state'&&this.inMatch&&data.turn===id&&['frame','stroke','finish'].includes(data.kind)){
   this.broadcast(data,id);
   this.onState?.(data);
  }
 }

 fromHost(data){
  if(data.type==='error'){this.close(String(data.message||'Room unavailable'));return}
  if(data.type==='roster'&&data.protocol===protocol&&partySlots.slice(1).includes(data.you)){
   const players={};
   for(const id of partySlots){
    const profile=cleanProfile(data.players?.[id]);
    if(profile)players[id]=profile;
   }
   if(!players.host||!players[data.you])return;
   const joined=!this.connected;
   clearTimeout(this.joinTimer);
   this.id=data.you;this.players=players;
   if(courses.includes(data.settings?.course))this.settings={course:data.settings.course,length:data.settings.length===9?9:18};
   this.onParty?.(players,joined);
  }else if(this.connected&&!this.inMatch&&data.type==='start'&&courses.includes(data.course)){
   const ids=this.playerIds;
   if(!Array.isArray(data.order)||new Set(data.order).size!==ids.length||data.order.length!==ids.length||!data.order.every(id=>ids.includes(id)))return;
   this.startMatch(data);
  }else if(data.type==='state'&&this.inMatch)this.onState?.(data);
 }

 publishRoster(joined=false){
  for(const id of this.playerIds){
   if(id!=='host')this.write(this.connections.get(id),{type:'roster',protocol,you:id,players:this.players,settings:this.settings});
  }
  this.onParty?.(this.players,joined);
 }

 configure(course,length){
  if(this.role!=='host'||this.inMatch||!courses.includes(course))return;
  this.settings={course,length:length===9?9:18};
  this.publishRoster();
 }

 beginRound(){
  if(this.role!=='host'||!this.connected||this.inMatch||!this.settings)return;
  const order=this.playerIds;
  for(let index=order.length-1;index>0;index--){
   const swap=Math.floor(Math.random()*(index+1));
   [order[index],order[swap]]=[order[swap],order[index]];
  }
  const round={type:'start',...this.settings,order,wind:Array.from({length:this.settings.length},()=>Math.random()-.5)};
  this.broadcast(round);
  this.startMatch(round);
 }

 startMatch({course,length,order,wind}){
  this.inMatch=true;
  this.onStart?.(course,length===9?9:18,order,wind);
 }

 write(connection,data){
  if(!connection?.open)return;
  try{connection.send(data)}catch(error){this.status('Unable to send: '+error.message)}
 }

 broadcast(data,except){
  for(const id of this.playerIds){
   if(id!==except)this.write(this.connections.get(id),data);
  }
 }

 send(data){
  if(this.role==='guest')this.write(this.connections.get('host'),data);
  else if(data.type==='appearance'){
   this.players.host=cleanProfile(data.profile);this.publishRoster();
  }else this.broadcast(data);
 }
}
