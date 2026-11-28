import {CLUB_IRONS} from './irons.js?v=irons1';
import {WEDGES} from './wedges.js?v=sand1';

export const CLUBS={driver:{name:'DRIVER',speed:43,loft:.395,range:255},wood:{name:'3 WOOD',speed:39.8,loft:.42,range:228},hybrid:{name:'4 HYBRID',speed:42.2,loft:.315,range:191},...CLUB_IRONS,
 ...WEDGES,putter:{name:'PUTTER',speed:11,loft:.015,range:25}};

export function clubStats(type,item){
 const base=CLUBS[type];
 const price=item?.price||0;
 const upgrade=Math.min(.18,price*(item?.slot==='clubs'?.00023:.00068));
 const blade=Boolean(item?.blade);
 return {
  distance:Math.round(base.range*(1+upgrade)),
  speedScale:1+upgrade*.55,
  feel:Math.round((blade?82:70)+upgrade*95),
  moi:Math.round((blade?49:72)+upgrade*115),
 };
}

export function equipmentTypes(item){
 if(item.slot==='clubs')return Object.keys(CLUBS);
 if(item.slot==='wedges')return Object.keys(WEDGES);
 if(item.slot==='irons')return Object.keys(CLUB_IRONS);
 return CLUBS[item.slot]?[item.slot]:[];
}
