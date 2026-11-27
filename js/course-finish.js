import * as T from 'three';

export const finishes={
 royal:{rough:0x93a66e,green:0x95b276,collar:0x779951,sand:0xe0cfaa,cut:5.1,ridge:0x62724e},
 ocean:{rough:0xb4ad82,green:0x94aa78,collar:0x819569,sand:0xdfc99e,cut:4.3,ridge:0x748877},
 summit:{rough:0x8e9b7c,green:0x8dae7d,collar:0x698a63,sand:0xc9c0a8,cut:5.6,ridge:0x596e77},
 misty:{rough:0x999685,green:0x9eaf83,collar:0x808c67,sand:0xd1bca4,cut:4.8,ridge:0x786b78},
 dunes:{rough:0xd6a466,green:0x93ae6c,collar:0x7d8d55,sand:0xe7c487,cut:4.5,ridge:0xb77b53}
};

// World-space grain keeps the cut scale consistent around bends and across differently sized greens.
export function mow(material,course,index,putting){
 const prev=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 const angle=(putting?.47:.21)+(index%5)*.19,style=finishes[course]||finishes.royal;
 material.onBeforeCompile=shader=>{
  prev(shader);
  shader.uniforms.cutAxis={value:new T.Vector2(Math.cos(angle),Math.sin(angle))};
  shader.uniforms.cutWidth={value:putting?2.1:style.cut};
  shader.uniforms.crossCut={value:course==='royal'?.45:course==='summit'?.2:0};
  shader.fragmentShader='uniform vec2 cutAxis;uniform float cutWidth,crossCut;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   vec2 cutP=coursePoint.xz;
   float pass=dot(cutP,cutAxis)/cutWidth;
   float stripe=sin(pass*3.14159);
   float crossPass=sin(dot(cutP,vec2(-cutAxis.y,cutAxis.x))*3.14159/cutWidth);
   float fade=1.-smoothstep(.05,.7,fwidth(pass));
   diffuseColor.rgb*=1.+fade*(.078*stripe+.06*crossCut*crossPass);
   roughnessFactor=clamp(roughnessFactor-.08*fade*(.5+.5*stripe),.64,1.);
  `);
 };
 material.customProgramCacheKey=()=>key+'-mowing';
}

export function ridgeBackdrop(world){
 const style=finishes[world.current];if(!style)return;
 const alpine=world.current==='misty',mountain=alpine||world.current==='summit',coast=world.current==='ocean';
 const phase=world.holeIndex*.47,centerZ=70-world.length*.5;
 const pos=[],colors=[],idx=[],count=256,shade=new T.Color(),snow=new T.Color(0xd0c9ba);
 for(let band=0;band<2;band++){
  const start=pos.length/3;
  for(let j=0;j<=5;j++)for(let i=0;i<=count;i++){
   const a=i/count*Math.PI*2,t=j/5,r=345+band*104+t*54;
   const spine=.48+.22*Math.cos(3*a+phase)+.14*Math.sin(7*a-phase)+.09*Math.sin(17*a)+.045*Math.cos(37*a+phase);
   let crest=(mountain?(alpine?153:118):coast?32:48)*(spine+.18*band);
   if(world.current==='dunes')crest=22+78*T.MathUtils.smoothstep(spine,.49,.64)+16*band;
   if(coast)crest*=T.MathUtils.smoothstep(-Math.sin(a),-.15,.7);
   const y=-9+t*crest+Math.sin(Math.PI*t)*4*Math.sin(19*a+phase);
   pos.push(r*Math.sin(a),y,centerZ+r*Math.cos(a));
   shade.setHex(style.ridge).lerp(snow,mountain?T.MathUtils.smoothstep(y,69,125)*.72:0);
   shade.multiplyScalar(.72+.21*t+.10*Math.sin(21*a+phase)+.13*band);
   colors.push(shade.r,shade.g,shade.b);
   if(i<count&&j<5){const k=start+j*(count+1)+i;idx.push(k,k+1,k+count+1,k+1,k+count+2,k+count+1)}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();
 world.root.add(new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide})));
}

// Follow the shoulder of each hole in irregular drifts, with a bare margin around the putting surface.
export function plantMargins(world){
 if(!finishes[world.current])return;
 const alpine=world.current==='misty',coast=world.current==='ocean',park=world.current==='royal';
 let seed=19+world.holeIndex*83+world.current.charCodeAt(0)*791;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const stems=[],colors=[],heads=[],headColors=[],tint=new T.Color();
 for(let patch=0;patch<80;patch++){
  const z=75-rand()*(world.length+22),side=rand()<.5?-1:1;
  const x=world.fairwayX(z)+side*(world.station(z,2)+3+rand()*13);
  for(let j=0;j<24;j++){
   const px=x+(rand()-.5)*5,pz=z+(rand()-.5)*8;
   if(world.lie(px,pz)!=='ROUGH'||(coast&&px>=35)||Math.hypot((px-world.green.x)/world.green.rx,(pz-world.green.z)/world.green.rz)<1.5)continue;
   const y=world.groundHeight(px,pz),height=(coast?.46:park?.26:alpine?.22:.37)*(.55+rand());
   for(let k=0;k<4;k++){
    const a=rand()*Math.PI*2,h=height*(.7+.5*rand()),dx=Math.cos(a)*h*.47+(coast?.11:0),dz=Math.sin(a)*h*.47,w=.018;
    const bx=px+dx*.22,bz=pz+dz*.22;
    stems.push(bx-w,y,bz,bx+w,y,bz,px+dx,y+h,pz+dz);
    tint.setHex(coast?0xc2ad68:park?0x739050:alpine?0x747b64:0x67794d).multiplyScalar(.74+rand()*.35);
    colors.push(tint.r*.60,tint.g*.60,tint.b*.60,tint.r*.75,tint.g*.75,tint.b*.75,tint.r,tint.g,tint.b);
    if(k===0&&(park||alpine||coast)){
     const tip=coast?.035:.047;
     heads.push(px+dx-tip,y+h-.035,pz+dz,px+dx+tip,y+h-.027,pz+dz,px+dx,y+h+tip,pz+dz+.024);
     tint.setHex(coast?0xcbb57b:alpine?(patch%3?0xa18caa:0xdcbec9):(patch%3?0xe1d9ab:0xc7ad60));
     for(let v=0;v<3;v++)headColors.push(tint.r,tint.g,tint.b);
    }
   }
  }
 }
 for(const [vertices,shades] of [[stems,colors],[heads,headColors]]){
  if(!vertices.length)continue;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(shades,3));
  world.root.add(new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide})));
 }
}

export function terrainFinish(material,course){
 if(!finishes[course])return;
 const prev=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.onBeforeCompile=s=>{
  prev(s);
  s.vertexShader='varying float slopeY;\n'+s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n slopeY=normal.y;');
  const geology=course==='misty'||course==='summit';
  const region=geology?`
   float exposure=smoothstep(.035,.19,1.-slopeY)*smoothstep(3.,16.,coursePoint.y)+.14*smoothstep(21.,40.,coursePoint.y);
   float strata=.5+.5*sin(coursePoint.y*2.35+coursePoint.x*.25+2.*sin(coursePoint.z*.08));
   vec3 rock=mix(vec3(.13,.14,.14),vec3(.32,.30,.28),strata*.47+mottle*.48);
   diffuseColor.rgb=mix(diffuseColor.rgb,rock,clamp(exposure,0.,.95));`:course==='ocean'?`
   float dunes=smoothstep(23.,37.,coursePoint.x)*(.65+.35*mottle);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.30,.25,.145)*(.8+.28*mottle),dunes*.72);`:'';
  s.fragmentShader='varying float slopeY;\n'+s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float mottle=.5+.25*sin(coursePoint.x*.19+sin(coursePoint.z*.11))+.25*cos(coursePoint.z*.15-coursePoint.x*.08);
   diffuseColor.rgb*=.88+.23*mottle;
   ${region}`);
 };
 material.customProgramCacheKey=()=>key+'-ground-'+course;
}

export function teeBoard(world){
 if(!finishes[world.current])return;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;
 const ctx=canvas.getContext('2d'),hole=world.hole,last=hole.route.at(-1);
 const colors={royal:'#233f33',ocean:'#244755',summit:'#283d3b',misty:'#493f48',dunes:'#633f2d'};
 ctx.fillStyle=colors[world.current];ctx.fillRect(0,0,512,384);
 ctx.strokeStyle='#afaa87';ctx.lineWidth=3;ctx.strokeRect(10,10,492,364);
 ctx.fillStyle='#f8f1dd';ctx.font='bold 76px Georgia';ctx.fillText(String(world.holeIndex+1).padStart(2,'0'),34,99);
 ctx.font='bold 32px Georgia';ctx.fillText(hole.name,34,161,298);
 ctx.font='23px sans-serif';ctx.fillText('PAR '+hole.par,36,222);
 const yd=hole.route.slice(1).reduce((sum,s,i)=>sum+Math.hypot(s[0]-hole.route[i][0],s[1]-hole.route[i][1]),0)*1.75;
 ctx.fillText(Math.round(yd)+' YARDS',36,257);
 const scale=Math.min(264/last[0],1.1),xs=hole.route.map(s=>s[1]);
 const cx=402-(Math.min(...xs)+Math.max(...xs))*scale*.5;
 const px=x=>cx+x*scale,py=d=>321-d*scale;
 ctx.beginPath();
 for(const [i,s] of hole.route.entries())ctx[i?'lineTo':'moveTo'](px(s[1]-s[2]),py(s[0]));
 for(const s of [...hole.route].reverse())ctx.lineTo(px(s[1]+s[2]),py(s[0]));
 ctx.closePath();ctx.fillStyle='#8d9d75';ctx.fill();
 function oval(x,d,rx,rz,color){ctx.beginPath();ctx.ellipse(px(x),py(d),rx*scale,rz*scale,0,0,2*Math.PI);ctx.fillStyle=color;ctx.fill()}
 for(const a of hole.water)oval(...a,'#608a96');
 for(const a of hole.sand)oval(...a,'#d2be90');
 oval(last[1],last[0],...hole.green,'#c1ce96');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const x=-3.8,z=69,ground=world.groundHeight(x,z);
 const post=world.mesh(new T.BoxGeometry(.11,1.05,.12),world.mat(0x554b39));post.position.set(x,ground+.52,z);
 const board=world.mesh(new T.BoxGeometry(1.16,.87,.075),world.mat(0x504b3d));board.position.set(x,ground+1.07,z);board.rotation.y=.30;
 const plaque=world.mesh(new T.PlaneGeometry(1.13,.845),new T.MeshBasicMaterial({map:texture}));
 plaque.position.copy(board.position);plaque.rotation.copy(board.rotation);plaque.translateZ(.04);plaque.userData.targetMap=texture;
}
