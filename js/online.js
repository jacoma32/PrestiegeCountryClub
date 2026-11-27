// The room host owns the roster and relays PeerJS messages to the other golfers.
const courses = ['royal', 'ocean', 'summit', 'misty'];
export const partySlots = ['host', 'guest1', 'guest2', 'guest3'];
export const partyLimit = partySlots.length;
const protocol = 2;
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
 get canInvite(){return this.role==='host'&&this.connections.size<partyLimit-1&&!this.ballot&&!this.inMatch}
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
  this.role='';this.id='';this.room='';this.ballot=null;this.inMatch=false;
  for(const connection of connections)connection.close();
  peer?.destroy();
 }

 close(message='Disconnected'){
  const active=!!this.room;
  this.cleanup();
  this.onVote?.(null);
  if(active)this.onDisconnect?.();
  this.status(message);
 }

 async host(course){
  this.cleanup();
  const generation=this.generation;
  this.role=this.id='host';
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
      this.write(connection,{type:'error',message:this.inMatch||this.ballot?'This party has already started.':'Room full.'});
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
   this.cancelVote();
   this.publishRoster();
   this.status('A golfer left the party.');
  });
  connection.on('error',()=>{if(current())connection.close()});
 }

 fromGuest(id,data){
  if(data.type==='hello'&&!this.players[id]){
   const profile=cleanProfile(data.profile);
   if(data.protocol!==protocol||!profile||this.ballot||this.inMatch){
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
  }else if(data.type==='requestVote')this.beginVote();
  else if(data.type==='pick'&&data.id===this.ballot?.id)this.recordPick(id,data.course);
  else if(data.type==='cancelVote'&&data.id===this.ballot?.id)this.cancelVote();
  else if(data.type==='state'&&this.inMatch&&data.turn===id&&['frame','finish'].includes(data.kind)){
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
   this.id=data.you;this.players=players;this.onParty?.(players,joined);
  }else if(this.connected&&data.type==='ballot'&&!this.inMatch){
   this.ballot={id:data.id,picks:data.picks};
   this.onVote?.(this.ballot);
  }else if(data.type==='cancelVote'&&data.id===this.ballot?.id){
   this.ballot=null;this.onVote?.(null);
  }else if(data.type==='start'&&this.ballot&&this.ballot.id===data.id&&courses.includes(data.course)){
   this.startMatch(data.course);
  }else if(data.type==='state'&&this.inMatch)this.onState?.(data);
 }

 publishRoster(joined=false){
  for(const id of this.playerIds){
   if(id!=='host')this.write(this.connections.get(id),{type:'roster',protocol,you:id,players:this.players});
  }
  this.onParty?.(this.players,joined);
 }

 beginVote(){
  if(!this.connected||this.ballot||this.inMatch)return;
  if(this.role==='guest'){this.send({type:'requestVote'});return}
  this.ballot={id:crypto.randomUUID(),picks:Object.fromEntries(this.playerIds.map(id=>[id,null]))};
  this.publishVote();
 }

 vote(course){
  if(!this.ballot||!courses.includes(course)||this.ballot.picks[this.id])return;
  if(this.role==='host')this.recordPick(this.id,course);
  else this.send({type:'pick',id:this.ballot.id,course});
 }

 recordPick(id,course){
  if(!this.ballot||this.ballot.picks[id]!==null||!courses.includes(course))return;
  this.ballot.picks[id]=course;
  this.publishVote();
  const picks=Object.values(this.ballot.picks);
  if(picks.some(pick=>pick===null))return;
  const totals=courses.map(course=>picks.filter(pick=>pick===course).length);
  const best=courses.filter((_,index)=>totals[index]===Math.max(...totals));
  const result=best[Math.floor(Math.random()*best.length)];
  this.broadcast({type:'start',id:this.ballot.id,course:result});
  this.startMatch(result);
 }

 publishVote(){
  this.broadcast({type:'ballot',...this.ballot});
  this.onVote?.(this.ballot);
 }

 cancelVote(){
  if(!this.ballot)return;
  const message={type:'cancelVote',id:this.ballot.id};
  if(this.role==='guest'){this.send(message);return}
  this.ballot=null;this.broadcast(message);this.onVote?.(null);
 }

 startMatch(course){
  this.inMatch=true;this.ballot=null;
  this.onVote?.(null);this.onStart?.(course);
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
