import {firebaseConfig} from './firebase-config.js?v=friends1';
const SDK='https://www.gstatic.com/firebasejs/11.10.0/';
const safeName=name=>String(name||'').trim().replace(/[^a-zA-Z0-9_]/g,'').slice(0,20);
export class FriendsService {
 constructor(onChange){this.onChange=onChange;this.user=null;this.profile=null;this.friends=[];this.requests=[];this.sent=[];this.unsub=[];this.timer=null;this.db=null;this.api=null}
 emit(){this.onChange?.(this)}
 async init(){
  if(!firebaseConfig.apiKey||!firebaseConfig.projectId||!firebaseConfig.appId)throw Error('Online friends need a Firebase project. See FIREBASE-SETUP.md in GitHub.');
  const [app,auth,fs]=await Promise.all([import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')]);
  this.api={...auth,...fs};
  const instance=app.initializeApp(firebaseConfig);
  this.db=fs.getFirestore(instance);
  const authentication=auth.getAuth(instance);
  this.user=(await auth.signInAnonymously(authentication)).user;
  const own=await fs.getDoc(fs.doc(this.db,'players',this.user.uid));
  if(own.exists())this.profile=own.data();
  this.listen();this.emit();
  return this;
 }
 async register(raw){
  const name=safeName(raw);if(name.length<3)throw Error('Username must have 3–20 letters, numbers or underscores.');
  if(this.profile?.username)return this.profile.username;
  const key=name.toLowerCase(),a=this.api;
  const handle=a.doc(this.db,'handles',key),player=a.doc(this.db,'players',this.user.uid);
  await a.runTransaction(this.db,async transaction=>{
   const [used,existing]=await Promise.all([transaction.get(handle),transaction.get(player)]);
   if(used.exists()&&used.data().uid!==this.user.uid)throw Error('That username is already taken.');
   if(existing.exists()&&existing.data().username)throw Error('This browser already has an online username.');
   transaction.set(handle,{uid:this.user.uid,username:name});
   transaction.set(player,{username:name,usernameLower:key,friends:[],lastSeen:a.serverTimestamp(),hosting:null,course:null});
  });
  this.profile={username:name,usernameLower:key,friends:[],hosting:null};
  this.listen();await this.heartbeat();return name;
 }
 listen(){
  this.unsub.forEach(f=>f());this.unsub=[];
  if(!this.user||!this.profile?.username)return;
  const a=this.api,db=this.db,uid=this.user.uid;
  this.unsub.push(a.onSnapshot(a.doc(db,'players',uid),snap=>{
   if(snap.exists()){this.profile=snap.data();this.refreshFriends()}this.emit();
  }));
  this.unsub.push(a.onSnapshot(a.query(a.collection(db,'requests'),a.where('toUid','==',uid)),snap=>{
   this.requests=snap.docs.filter(d=>d.data().status==='pending').map(d=>({id:d.id,...d.data()}));this.emit();
  }));
  this.unsub.push(a.onSnapshot(a.query(a.collection(db,'requests'),a.where('fromUid','==',uid)),snap=>{
   this.sent=snap.docs.map(d=>({id:d.id,...d.data()}));
   for(const request of this.sent.filter(r=>r.status==='accepted'&&!(this.profile?.friends||[]).includes(r.toUid))){
    this.addFriend(request.toUid).catch(console.warn);
   }
   this.emit();
  }));
  if(!this.timer)this.timer=setInterval(()=>this.heartbeat().catch(console.warn),30000);
  this.heartbeat().catch(console.warn);
 }
 async heartbeat(){
  if(!this.profile?.username)return;
  await this.api.updateDoc(this.api.doc(this.db,'players',this.user.uid),{lastSeen:this.api.serverTimestamp()});
 }
 async search(name){
  const key=safeName(name).toLowerCase();
  if(key.length<3)throw Error('Enter at least three username characters.');
  const a=this.api,snap=await a.getDoc(a.doc(this.db,'handles',key));
  if(!snap.exists())throw Error('No player with that username.');
  const other=snap.data();if(other.uid===this.user.uid)throw Error('You cannot friend yourself.');
  return other;
 }
 async sendRequest(name){
  if(!this.profile?.username)throw Error('Choose your online username first.');
  const other=await this.search(name);
  if((this.profile.friends||[]).includes(other.uid))throw Error('Already friends.');
  const a=this.api,id=other.uid+'_'+this.user.uid;
  await a.setDoc(a.doc(this.db,'requests',id),{fromUid:this.user.uid,fromName:this.profile.username,toUid:other.uid,status:'pending',createdAt:a.serverTimestamp()});
  return other.username;
 }
 async addFriend(uid){
  if(!this.profile?.username)return;
  await this.api.updateDoc(this.api.doc(this.db,'players',this.user.uid),{friends:this.api.arrayUnion(uid)});
 }
 async accept(id){
  const req=this.requests.find(r=>r.id===id);
  if(!req)return;
  const a=this.api;
  await a.updateDoc(a.doc(this.db,'requests',id),{status:'accepted'});
  await this.addFriend(req.fromUid);
 }
 async reject(id){const req=this.requests.find(r=>r.id===id);if(req)await this.api.updateDoc(this.api.doc(this.db,'requests',id),{status:'declined'})}
 refreshFriends(){
  const ids=(this.profile?.friends||[]).slice(0,100),key=JSON.stringify(ids);
  if(key===this.friendKey)return;this.friendKey=key;
  (this.friendListeners||[]).forEach(stop=>stop());this.friends=[];
  const a=this.api;
  this.friendListeners=ids.map(uid=>a.onSnapshot(a.doc(this.db,'players',uid),snap=>{
   this.friends=this.friends.filter(f=>f.uid!==uid);
   if(snap.exists())this.friends.push({uid,...snap.data()});this.emit();
  }));
 }
 async findInvite(){
  const current=this.friends.find(friend=>this.pendingInvite(friend));
  const known=new Set(this.friends.map(friend=>friend.uid));
  const ids=(this.profile?.friends?.slice(0,100)||[]).filter(uid=>!known.has(uid));
  if(current||!ids.length)return current;
  const {getDoc,doc}=this.api;
  const updates=await Promise.allSettled(ids.map(uid=>getDoc(doc(this.db,'players',uid))));
  for(const [index,result] of updates.entries()){
   if(result.status!=='fulfilled'||!result.value.exists())continue;
   const friend={uid:ids[index],...result.value.data()};
   if(this.pendingInvite(friend))return friend;
  }
 }
 pendingInvite(friend){
  if(!friend || friend.invited!==this.user?.uid || !friend.hosting || !friend.inviteId)return false;
  const issued=friend.inviteTime?.toMillis?.();
  return Date.now()-issued<120000 && this.profile?.partyReplies?.[friend.uid]?.id!==friend.inviteId;
 }
 async reply(friend,answer){
  if(!this.pendingInvite(friend))return false;
  const field=new this.api.FieldPath('partyReplies',friend.uid);
  await this.api.updateDoc(this.api.doc(this.db,'players',this.user.uid),field,{id:friend.inviteId,answer});
  return true;
 }
 async host(code,course,invited=null){
  if(!this.profile?.username)return;
  if(invited && !this.profile.friends.includes(invited))throw Error('Add this golfer as a friend first.');
  await this.api.updateDoc(this.api.doc(this.db,'players',this.user.uid),{
   hosting:code,course,invited,inviteId:invited?crypto.randomUUID():null,
   inviteTime:invited?this.api.serverTimestamp():null,lastSeen:this.api.serverTimestamp()
  });
 }
 async unhost(){
  if(!this.profile?.username)return;
  await this.api.updateDoc(this.api.doc(this.db,'players',this.user.uid),{hosting:null,course:null,invited:null});
 }
}
export function isOnline(player){return typeof player?.lastSeen?.toMillis==='function'&&Date.now()-player.lastSeen.toMillis()<90000}
