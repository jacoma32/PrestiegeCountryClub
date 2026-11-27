// Carry is measured in game yards. Launch is the delivered ball angle, distinct from face loft.
export const WEDGES={
 pitching:{name:'PITCHING WEDGE',degrees:46,range:118,launch:34,chipAngle:13,stop:.64,sand:.48,rough:.83,soleWidth:.012,bounce:8},
 approach:{name:'APPROACH WEDGE',degrees:52,range:100,launch:40,chipAngle:29,stop:.46,sand:.58,rough:.87,soleWidth:.015,bounce:10},
 wedge:{name:'SAND WEDGE',degrees:56,range:82,launch:47,chipAngle:43,stop:.32,sand:.73,rough:.94,soleWidth:.022,bounce:14},
 lob:{name:'LOB WEDGE',degrees:60,range:65,launch:54,chipAngle:58,stop:.17,sand:.60,rough:.76,soleWidth:.014,bounce:7}
};

export function wedgeLaunch(spec,power,lie){
 const blend=Math.max(0,Math.min(1,(power-.30)/.55));
 const angle=(spec.chipAngle+(spec.launch-spec.chipAngle)*blend)*Math.PI/180;
 const fullLaunch=spec.launch*Math.PI/180;
 const fullSpeed=Math.sqrt(spec.range*9.81/(1.75*Math.sin(2*fullLaunch)));
 const lieFactor=lie==='BUNKER'?spec.sand:lie==='ROUGH'?spec.rough:1;
 const speed=fullSpeed*power**.8*lieFactor;
 return {horizontal:speed*Math.cos(angle),vertical:speed*Math.sin(angle)};
}
