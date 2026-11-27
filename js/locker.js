import {playerSave} from './player-save.js';

import {brandedGear} from './pro-shop-catalog.js?v=clubs1';

// The clubhouse supports one local member per browser, including guest play before registration.
export const walletKey='prestiege-club-wallet-v1';
export const gearSections={shirt:'Polos',ball:'Golf balls',hat:'Hats',bag:'Golf bags',clubs:'Club sets',driver:'Drivers',wood:'Fairway woods',hybrid:'Hybrids',wedges:'Wedges',putter:'Putters'};
const legacyDefaults={shirt:'custom',ball:'white',hat:'club-cap',bag:'club-bag',clubs:'club-set'};
const defaults=Object.fromEntries(brandedGear.filter(item=>item.price===0).map(item=>[item.slot,item.id]));
export const catalog=[
 ...brandedGear,
 {id:'custom',slot:'shirt',name:'Creator polo',price:0,color:null},
 {id:'white',slot:'ball',name:'Classic white',price:0,color:'#f9f9f3'},
 {id:'links',slot:'shirt',name:'Links pinstripe',price:70,pattern:'pinstripe'},
 {id:'marina',slot:'shirt',name:'Marina sailor stripe',price:50,pattern:'breton'},
 {id:'claret',slot:'shirt',name:'Club twin stripe',price:90,pattern:'twin'},
 {id:'pane',slot:'shirt',name:'Windowpane check',price:65,pattern:'windowpane'},
 {id:'argyle',slot:'shirt',name:'Highland argyle',price:100,pattern:'argyle'},
 {id:'dot',slot:'shirt',name:'Tour microdot',price:45,pattern:'dot'},
 {id:'chevron',slot:'shirt',name:'Summit chevron',price:75,pattern:'chevron'},
 {id:'wave',slot:'shirt',name:'Ocean swell',price:85,pattern:'wave'},
 {id:'gingham',slot:'shirt',name:'Clubhouse gingham',price:60,pattern:'gingham'},
 {id:'links-cross',slot:'shirt',name:'Cross stitch',price:50,pattern:'cross'},
 {id:'scallop',slot:'shirt',name:'Deco scallop',price:95,pattern:'scallop'},
 {id:'pine',slot:'shirt',name:'Summit spruce',price:100,pattern:'spruce'},
 {id:'bolt',slot:'shirt',name:'Lightning bolts',price:90,pattern:'bolt'},
 {id:'flag',slot:'shirt',name:'Pin flags',price:80,pattern:'flag'},
 {id:'ruby',slot:'ball',name:'Cherry red',price:35,color:'#ed2442'},
 {id:'mint',slot:'ball',name:'Seafoam mint',price:40,color:'#76efb1'},
 {id:'cobalt',slot:'ball',name:'Cobalt blue',price:50,color:'#294ddd'},
 {id:'pink',slot:'ball',name:'Hot pink',price:45,color:'#ff319d'},
 {id:'jade',slot:'ball',name:'Deep jade',price:55,color:'#008c78'},
 {id:'gold',slot:'ball',name:'Marigold',price:40,color:'#ffc42d'},
 {id:'plum',slot:'ball',name:'Black cherry',price:60,color:'#621943'},
 {id:'pearl',slot:'ball',name:'Silver mist',price:50,color:'#afbcca'},
 {id:'lime',slot:'ball',name:'Electric lime',price:40,color:'#91ff19'},
 {id:'graphite',slot:'ball',name:'Graphite',price:65,color:'#414650'},
 {id:'tangerine',slot:'ball',name:'Tangerine',price:45,color:'#ff9d26'},
 {id:'violet',slot:'ball',name:'Orchid',price:55,color:'#d493ff'},
 {id:'lemon',slot:'ball',name:'Tour yellow',price:20,color:'#eaff35'},
 {id:'coral',slot:'ball',name:'Sunset coral',price:35,color:'#ff694b'},
 {id:'ice',slot:'ball',name:'Glacier blue',price:50,color:'#7adaff'},
 {id:'club-cap',slot:'hat',name:'Club cap',price:0,color:'#213b45'},
 {id:'sand-cap',slot:'hat',name:'Sandstone performance cap',price:40,color:'#e5d0aa'},
 {id:'pine-cap',slot:'hat',name:'Pine tour cap',price:55,color:'#22775a'},
 {id:'claret-cap',slot:'hat',name:'Claret twill cap',price:50,color:'#96293d'},
 {id:'club-bag',slot:'bag',name:'Club cart bag',price:0,color:'#202824',trim:'#3c4541'},
 {id:'coastal-bag',slot:'bag',name:'Coastal cart bag',price:95,color:'#235880',trim:'#d9eaf0'},
 {id:'saddle-bag',slot:'bag',name:'Saddle leather cart bag',price:125,color:'#844b2c',trim:'#dab276'},
 {id:'club-set',slot:'clubs',name:'Club steel set',price:0},
 {id:'smoke-set',slot:'clubs',name:'Smoked chrome set',price:145,color:'#505d75',accent:'#567fde'},
 {id:'copper-set',slot:'clubs',name:'Brushed copper set',price:170,color:'#ce8b60',accent:'#773b26'}
];
const products=new Map(catalog.map(item=>[item.id,item]));
export const itemById=id=>products.get(id);
const clubSlots=['clubs','driver','wood','hybrid','wedges','putter'];
export function clubLoadout(equipped){
 const loadout={clubs:'club-set'};
 for(const slot of clubSlots){
  const item=itemById(equipped?.[slot]);
  if(item?.slot===slot)loadout[slot]=item.id;
 }
 return loadout;
}
export function clubChoice(loadout,type){
 const slot=typeof type==='string'&&type.startsWith('iron')?'clubs':['pitching','approach','wedge','lob'].includes(type)?'wedges':type;
 return itemById(loadout?.[slot])??itemById(loadout?.clubs)??itemById('club-set');
}
export function wallet(){
 const cloud = playerSave();
 if (cloud) return normalizeWallet(structuredClone(cloud.state.wallet), slot => cloud.state.slots?.[slot]);
 const raw=localStorage.getItem(walletKey);
 return normalizeWallet(raw ? JSON.parse(raw) : undefined, slot => localStorage.getItem(walletKey+'-'+slot));
}
function normalizeWallet(saved, readSlot){
 const state=saved??{credits:0,owned:[],equipped:{},rounds:{}};
 const legacy=state.owned.includes('white');
 state.owned=[...new Set([...state.owned,'custom',...Object.values(defaults),...(legacy?Object.values(legacyDefaults):[])])];
 state.equipped={...defaults,...state.equipped};
 for(const slot of Object.keys(gearSections)){
  if(clubSlots.includes(slot)&&slot!=='clubs')delete state.equipped[slot];
  const choice=readSlot(slot);
  if(state.owned.includes(choice)&&itemById(choice)?.slot===slot)state.equipped[slot]=choice;
 }
 return state;
}
function update(change){
 const cloud = playerSave();
 if (cloud) return cloud.update(save => {
  const state = normalizeWallet(save.wallet, () => undefined);
  const result = change(state);
  save.wallet = state;
  return result;
 });
 const commit=()=>{
  const state=wallet(),result=change(state);
  localStorage.setItem(walletKey,JSON.stringify(state));
  return result;
 };
 return navigator.locks?navigator.locks.request(walletKey,commit):Promise.resolve().then(commit);
}
export function award(round,hole,shots){
 if(!Number.isInteger(shots)||shots<1||!Number.isInteger(hole)||hole<0||hole>17||!round)throw Error('Invalid hole result');
 return update(state=>{
  const bit=1<<hole;
  if(state.rounds[round]&bit)return 0;
  const credits=[100,50,35][shots-1]??20;
  state.rounds[round]=(state.rounds[round]||0)|bit;
  state.credits+=credits;
  return credits;
 });
}
export function buy(id){
 return update(state=>{
  const item=itemById(id);
  if(!item||state.owned.includes(id))return false;
  if(state.credits<item.price)throw Error('Earn more coins on the course.');
  state.credits-=item.price;state.owned.push(id);return true;
 });
}
export function wear(id){
 const item=itemById(id);
 if(!item||!wallet().owned.includes(id))throw Error('Purchase this item first.');
 const cloud = playerSave();
 if (cloud) return cloud.update(save => {
  save.slots ??= {};
  save.slots[item.slot] = id;
 });
 // A single-slot write commits before navigation and cannot overwrite a concurrent payout.
 localStorage.setItem(walletKey+'-'+item.slot,id);
}

export function unequip(slot){
 if(!clubSlots.includes(slot)||slot==='clubs')return;
 const cloud = playerSave();
 if (cloud) return cloud.update(save => { if (save.slots) delete save.slots[slot]; });
 localStorage.removeItem(walletKey+'-'+slot);
}
