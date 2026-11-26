import {protectGreens} from './green-layout.js';
import {finishes,mow,ridgeBackdrop,plantMargins,terrainFinish,teeBoard} from './course-finish.js';
import {waterMaterial,coastalBank,shoreX} from './water.js?v=tour72';
import {landscape,fairwayCollar,sandFinish,cartPath} from './course-landscape.js?v=tour72';
import {TreeContact} from './tree-contact.js';
import {plantTrees,horizon,detailSurface,frameHole,cutBunkers} from './course-detail.js?v=tour72';
import {extendCourses} from './full-round.js';
import * as THREE from 'three';
export const COURSES={royal:{name:'THE ROYAL CLASSIC',type:'parkland',sky:0x93bed0,fog:0xb4c5a7,grass:0x507849,rough:0x3e6140,fairway:0x7aa65e,trees:0x254b2b,wind:3,holes:[
 {"name":"Orchard Bend","par":4,"hint":"Favor the left landing area to open the turn.","route":[[0,0,10,0],[55,-13,20,0],[118,-37,16,0],[184,8,9,0]],"green":[11,10],"sand":[[-12,112,9,12],[0,174,5,4]],"water":[]},
 {"name":"The Postage Stamp","par":3,"hint":"Fly the front bunker to a shallow green.","route":[[0,0,8,0],[35,2,8,0],[64,9,8,0],[89,17,6,0]],"green":[12,6],"sand":[[15,79,11,4],[30,90,4,7]],"water":[]},
 {"name":"Captain’s Corner","par":5,"hint":"Lay up before the cross bunkers or take on the corner.","route":[[0,0,10,0],[65,22,17,0],[145,54,22,0],[207,18,13,0],[265,-4,10,0]],"green":[10,13],"sand":[[35,136,9,7],[49,139,5,6],[11,253,6,9]],"water":[]}
]},
ocean:{name:"OCEAN'S EDGE",type:'coastal',sky:0x8abdd4,fog:0xa5c3bf,grass:0x4e826b,rough:0x467769,fairway:0x86a881,trees:0x385d4c,wind:12,holes:[
 {"name":"Shoreline Run","par":4,"hint":"Carry the tidal cut. The left fairway stays dry past the inlet.","route":[[0,0,11,0],[70,-16,14,0],[130,-18,12,0],[192,15,9,0]],"green":[9,13],"sand":[[-29,120,5,12]],"water":[[16,119,17,33],[-2,66,16,8],[24,175,13,15]]},
 {"name":"Tidepool Carry","par":3,"hint":"Carry the front pool. Water guards the right side and the back of the green.","route":[[0,0,9,0],[28,-5,10,0],[54,-14,9,0],[81,-21,8,0]],"green":[10,9],"sand":[[-33,77,4,8]],"water":[[-13,48,31,19],[1,75,12,11],[-22,98,18,8]]},
 {"name":"The Peninsula","par":5,"hint":"Drive toward the left shelf. Split the two coves on the approach.","route":[[0,0,10,0],[80,-31,21,0],[152,-42,18,0],[212,-17,13,0],[259,21,7,0]],"green":[8,11],"sand":[[-52,149,6,13]],"water":[[7,189,28,42],[1,260,11,20],[-6,125,22,19],[-30,207,12,12]]}
]},
summit:{name:'SUMMIT PINES',type:'mountain',sky:0x9dc2d4,fog:0xa4b8af,grass:0x3f6547,rough:0x355940,fairway:0x72966a,trees:0x1e4133,wind:6,holes:[
 {"name":"Ridge Walk","par":4,"hint":"Find the broad saddle before the uphill approach.","route":[[0,0,10,0],[64,12,15,1],[128,29,18,1],[187,38,9,7]],"green":[10,9],"sand":[[15,129,6,11],[24,184,5,6]],"water":[]},
 {"name":"The Drop","par":3,"hint":"Club down from the high tee to the valley green.","route":[[0,0,9,11],[30,-6,9,6],[68,-16,10,1],[106,-29,8,-2]],"green":[9,12],"sand":[[-16,101,6,7],[-39,119,5,6]],"water":[]},
 {"name":"Switchback","par":4,"hint":"Aim right to the high shelf before turning back left.","route":[[0,0,9,0],[57,25,13,3],[108,49,17,7],[152,20,11,5],[208,-18,8,2]],"green":[9,10],"sand":[[27,104,11,15],[2,168,6,9],[-29,201,4,7]],"water":[]}]},
misty:{name:'MISTY PINNACLE',type:'mountain',sky:0xa0b0b6,fog:0xaebdc1,grass:0x496c50,rough:0x344941,fairway:0x779b70,trees:0x263f32,wind:10,holes:[
{name:'Cloud Ridge',par:4,hint:'Follow the crest through the pines to the lower shelf.',route:[[0,0,10,22],[55,8,15,23],[110,-12,13,20],[174,4,9,18]],green:[10,9],sand:[[-13,115,5,8]],water:[]},
{name:'Alpine Saddle',par:3,hint:'Play a controlled 9 iron downhill to the sheltered green.',route:[[0,0,10,24],[12,0,12,24],[50,-5,15,17],[78,-9,12,12],[92,-9,10,12]],green:[10,9],sand:[],water:[]},
{name:'Granite Pass',par:4,hint:'Follow the narrow ridge and aim for the shelf below the peak.',route:[[0,0,10,22],[65,-15,14,25],[130,10,12,20],[195,20,8,16]],green:[9,10],sand:[[24,130,5,7]],water:[]}
]}};
extendCourses(COURSES);
protectGreens(COURSES);
COURSES.range={...COURSES.royal,name:'DRIVING RANGE',wind:0,holes:[{
 name:'Practice tee',par:0,hint:'Pick a club and aim at a yardage marker.',
 route:[[0,0,30,0],[185,0,42,0]],green:[4,4],sand:[],water:[]
}]};
const clamp=THREE.MathUtils.clamp;
const rand=(n)=>{const x=Math.sin(n*178.126+78.77)*42375.935;return x-Math.floor(x)};
const FRINGE_WIDTH=1.25,FRINGE_LIFT=.046,GREEN_LIFT=.055;
export class World{
 constructor(scene){this.waterClock={value:0};this.scene=scene;this.root=new THREE.Group();scene.add(this.root);this.tmp=new THREE.Vector3();this.current='royal';this.holeIndex=0;this.hole={yards:278,par:4,curve:0};this.length=158;this.holePosition=new THREE.Vector3(0,0,0);this.teePosition=new THREE.Vector3(0,0,0);this.fairways=[];this.bunkers=[];this.water=[];this.green=null;this.flag=null;this.grassTexture=this.makeGrassTexture(false);this.fairwayTexture=this.makeGrassTexture(true);this.create('royal',0)}
 makeGrassTexture(fairway=false){const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');x.fillStyle=fairway?'#6f9857':'#3e6840';x.fillRect(0,0,512,512);let seed=fairway?91:27;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let i=0;i<12500;i++){const a= fairway?`rgba(${80+Math.floor(rnd()*55)},${112+Math.floor(rnd()*60)},${48+Math.floor(rnd()*34)},${.08+rnd()*.2})`:`rgba(${20+Math.floor(rnd()*50)},${55+Math.floor(rnd()*55)},${24+Math.floor(rnd()*30)},${.08+rnd()*.24})`;x.fillStyle=a;const w=1+rnd()*3;x.fillRect(rnd()*512,rnd()*512,w,.7+rnd()*2)}const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(fairway?2:22,fairway?3:22);tex.anisotropy=8;return tex}
 mat(color,rough=1){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0})}
 mesh(geo,mat,par=this.root){const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;m.castShadow=true;par.add(m);return m}
 // Stations describe the center, playable width and height at each distance from the tee.
 station(z, column) {
  const route=this.hole.route, distance=70-z;
  const end=route.findIndex(row=>row[0]>=distance);
  if(end<0)return route.at(-1)[column];
  if(end===0)return route[0][column];
  const a=route[end-1], b=route[end];
  const span=b[0]-a[0],t=(distance-a[0])/span;
  if(column===3)return THREE.MathUtils.lerp(a[column],b[column],t);
  // A monotone cubic follows every design station without sharp corners or extra doglegs.
  const secant=(u,v)=>(v[column]-u[column])/(v[0]-u[0]);
  const tangent=(p,q)=>p*q<=0?0:2*p*q/(p+q);
  const slope=secant(a,b),left=end>1?tangent(secant(route[end-2],a),slope):slope;
  const right=end+1<route.length?tangent(slope,secant(b,route[end+1])):slope;
  return THREE.MathUtils.lerp(a[column],b[column],t*t*(3-2*t))+span*t*(1-t)*((1-t)*left-t*right);
 }
 groundHeight(x,z){
  if(this.current==='range')return 0;
  const edge=Math.abs(x-this.fairwayX(z))-this.station(z,2);
  const outside=THREE.MathUtils.smoothstep(edge,1,42);
  const hills=this.current==='ocean'&&x>36?0:outside*(2.2+1.4*Math.sin(x*.052+z*.056)+1.1*Math.cos(z*.071-x*.024));
  let sandDepth=0;
  for(const [cx,d,rx,rz] of this.hole.sand){
   const u=(x-cx)/rx,v=(z-70+d)/rz, radius=Math.hypot(u,v)/this.bunkerEdge(Math.atan2(v,u));
   sandDepth+=.68*(1-THREE.MathUtils.smoothstep(radius,.53,1.08))-.15*Math.exp(-((radius-1.06)**2)/.012);
  }
  // A continuous valley floor joins the playable shelves to the surrounding ridges.
  const ridge=this.current==='misty'?THREE.MathUtils.smoothstep(edge,4,108)*
   (38+17*Math.sin(z*.024+x*.019)+11*Math.cos(x*.051-z*.013)):0;
  const phase=this.holeIndex*1.71,shoulder=THREE.MathUtils.smoothstep(edge,5,51);
  let landform=0;
  if(this.current==='summit')landform=shoulder*(8+4.8*Math.sin(.031*z+.023*x+phase)+3.6*Math.cos(.034*x-phase));
  if(this.current==='ocean'&&x<28)landform=shoulder*(1.3+1.1*Math.cos(x*.21-z*.065+phase));
  return landform+ridge+hills-sandDepth+ this.station(z,3)+.5*Math.sin(x*.053)*Math.sin(z*.025)+.26*Math.sin(z*.049+x*.017)}
 getGreenZ(){return 70-this.length}
 fairwayX(z){return this.station(z,1)}
 greenEdge(a){return 1+.06*Math.sin(2*a+.5)+.085*Math.cos(3*a-.4)+.019*Math.sin(7*a+this.holeIndex*.7)}
 bunkerEdge(a){return 1+.14*Math.sin(3*a+.5)+.08*Math.cos(5*a)}
 surfaceEllipse(x,z,rx,rz,material,lift,scalloped=false,inner=0) {
  const geometry=new THREE.RingGeometry(inner,1,96,14);
  const vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const u=vertices.getX(i),v=-vertices.getY(i);
   const edge=scalloped==='green'?this.greenEdge(Math.atan2(v,u)):scalloped?this.bunkerEdge(Math.atan2(v,u)):1;
   const px=x+u*rx*edge,pz=z+v*rz*edge;
   vertices.setXYZ(i,px,this.groundHeight(px,pz)+lift,pz);
  }
  geometry.computeVertexNormals();this.mesh(geometry,material).castShadow=false;
 }
 create(name,idx){
  this.scene.remove(this.root);
  this.root.traverse(object=>{
   object.userData.targetMap?.dispose();
   object.geometry?.dispose();
   object.material?.dispose();
   if(object.isInstancedMesh)object.dispose();
  });this.root=new THREE.Group();this.scene.add(this.root);this.treeContact=new TreeContact();this.current=name;this.holeIndex=idx;const c=COURSES[name], h=c.holes[idx],finish=finishes[name]||finishes.royal;this.hole=h;this.length=h.route.at(-1)[0];this.scene.background=new THREE.Color(c.sky);
 const dome=new THREE.Mesh(new THREE.SphereGeometry(820,40,20),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,uniforms:{dusk:{value:name==='misty'?1:0},horizon:{value:new THREE.Color(c.sky).lerp(new THREE.Color(0xffecc9),.42)},zenith:{value:new THREE.Color(0x518ac0)}},
  vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float dusk;uniform vec3 horizon,zenith;varying vec3 direction;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
   void main(){vec3 d=normalize(direction);float h=pow(max(d.y,0.),.55);
   float glow=pow(max(dot(d,normalize(vec3(-200.,90.,-310.))),0.),60.);
   vec2 p=d.xz/max(.055,d.y)*1.8;
   float cloud=.53*noise(p)+.27*noise(p*2.04)+.13*noise(p*4.13)+.07*noise(p*8.29);
   float veil=smoothstep(.48,.70,cloud)*smoothstep(.018,.16,d.y);
   gl_FragColor=vec4(mix(mix(horizon,zenith,h),vec3(.90,.92,.90),veil*.84)+vec3(.35,.25,.12)*glow,1.);
   if(dusk>.5){
    vec3 sunDir=normalize(vec3(-.34,.155,-1.));
    float alignment=max(dot(d,sunDir),0.);
    vec3 sky=mix(vec3(.88,.38,.19),vec3(.12,.12,.29),smoothstep(-.03,.68,d.y));
    sky=mix(sky,vec3(.84,.42,.36),veil*.72);
    sky+=vec3(.78,.34,.10)*pow(alignment,46.)+vec3(2.1,1.55,.80)*smoothstep(.99973,.99994,alignment);
    gl_FragColor.rgb=sky;
   }
   #include <colorspace_fragment>
   }`
 }));dome.renderOrder=-1;this.root.add(dome);this.scene.fog=new THREE.FogExp2(name==='misty'?0xc49c9f:c.fog,name==='misty'?.0082:.0044);this.fairways=[];this.bunkers=[];this.water=[];const gmat=this.mat(c.grass);gmat.map=this.grassTexture;gmat.color.set(finish.rough);const terrain=new THREE.PlaneGeometry(750,650,300,260);terrain.rotateX(-Math.PI/2);const p=terrain.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,this.groundHeight(x,z))}if(name==='misty'){
  const shades=[],low=new THREE.Color(0xffffff),granite=new THREE.Color(0xabada6),tint=new THREE.Color();
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),z=p.getZ(i),rise=p.getY(i)-this.station(z,3);
   tint.copy(low).lerp(granite,THREE.MathUtils.smoothstep(rise,12,43));
   shades.push(tint.r,tint.g,tint.b);
  }
  terrain.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));gmat.vertexColors=true;
 }
 terrain.computeVertexNormals();const base=this.mesh(terrain,gmat);base.castShadow=false;
 const fair=this.mat(c.fairway);fair.map=this.fairwayTexture;fair.color.set(c.fairway).lerp(new THREE.Color(0xd3d7aa),.52);const fringe=this.mat(finish.collar);const greenMat=this.mat(finish.green);const teeMat=this.mat(0x6da461);const sand=this.mat(finish.sand);
 for(const mat of [greenMat,teeMat,fair,gmat,fringe])detailSurface(mat);terrainFinish(gmat,name);mow(fair,name,idx,false);mow(greenMat,name,idx,true);for(const mat of [gmat,fair,teeMat,fringe,greenMat])cutBunkers(mat,h.sand);
 this.teePosition.set(0,this.groundHeight(0,70)+.04,70);this.holePosition.set(this.fairwayX(this.getGreenZ()),0,this.getGreenZ());this.holePosition.y=this.groundHeight(this.holePosition.x,this.holePosition.z)+.035;
 const strips=150,lanes=24,verts=[],uv=[],indices=[];
 for(let i=0;i<=strips;i++){
  const t=i/strips,z=70-t*this.length,x=this.fairwayX(z),w=this.station(z,2);
  for(let j=0;j<=lanes;j++){
   const px=x+w*(2*j/lanes-1);
   verts.push(px,this.groundHeight(px,z)+.035,z);uv.push(px*.027,(z+.35*px)*.035);
   if(i<strips&&j<lanes){const a=i*(lanes+1)+j;indices.push(a,a+1,a+lanes+1,a+1,a+lanes+2,a+lanes+1)}
  }
 }
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));fg.setIndex(indices);fg.computeVertexNormals();this.mesh(fg,fair);
 if(name!=='range'){
  const collar=this.mat(name==='ocean'?0x75917a:0x6c8859);collar.map=this.grassTexture;detailSurface(collar);cutBunkers(collar,h.sand);
  fairwayCollar(this,collar);sandFinish(sand);
 }
 this.surfaceEllipse(0,70,8,6,teeMat,.05);
 this.green={x:this.holePosition.x,z:this.holePosition.z,rx:h.green[0],rz:h.green[1]};
 this.surfaceEllipse(this.green.x,this.green.z,h.green[0]+FRINGE_WIDTH,h.green[1]+FRINGE_WIDTH,fringe,FRINGE_LIFT,'green');
 this.surfaceEllipse(this.green.x,this.green.z,...h.green,greenMat,GREEN_LIFT,'green');
 this.holePosition.y=this.groundHeight(this.green.x,this.green.z)+.06;
 const holeRing=this.mesh(new THREE.RingGeometry(.12,.29,28),this.mat(0xe5e5de));holeRing.rotation.x=-Math.PI/2;holeRing.position.copy(this.holePosition).add(new THREE.Vector3(0,.016,0));const cup=this.mesh(new THREE.CircleGeometry(.12,24),this.mat(0x101715));cup.rotation.x=-Math.PI/2;cup.position.copy(this.holePosition).add(new THREE.Vector3(0,.02,0));
 for(const [features,collection,material] of [[h.sand,this.bunkers,sand],[h.water,this.water,null]]){
  for(const [x,distance,rx,rz] of features){
   const z=70-distance;collection.push({x,z,rx,rz});if(collection===this.bunkers)this.surfaceEllipse(x,z,rx*1.045,rz*1.045,this.mat(0x645b39),.082,true,.953);
   this.surfaceEllipse(x,z,rx,rz,material||waterMaterial(this.waterClock,name==='ocean',{x,z,rx,rz}),.10,collection===this.bunkers);
  }
 }
 if(name==='ocean'){
  const sea=this.mesh(new THREE.PlaneGeometry(338,650,130,180),waterMaterial(this.waterClock,true));
  sea.geometry.rotateX(-Math.PI/2);
  const v=sea.geometry.attributes.position;
  for(let i=0;i<v.count;i++){const z=v.getZ(i),shore=shoreX(z),x=shore+(v.getX(i)+169)*(376-shore)/338;v.setXYZ(i,x,this.groundHeight(x,z)+.08,z)}
  sea.geometry.computeVertexNormals();sea.castShadow=false;coastalBank(this,this.waterClock);
 }
 if(name!=='range')cartPath(this);
 const planting=landscape(this);
 this.flag=new THREE.Group();const pole=this.mesh(new THREE.CylinderGeometry(.035,.045,5,8),this.mat(0xf1f1df),this.flag);pole.position.y=2.5;const flagMaterial=this.mat(name==='ocean'?0xf3cd73:name==='misty'?0xe78968:0xd8bb71);
 flagMaterial.side=THREE.DoubleSide;
 flagMaterial.onBeforeCompile=shader=>{
  shader.uniforms.flagTime=this.waterClock;
  shader.vertexShader='uniform float flagTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float sail=uv.x;transformed.z+=sail*(.18*sin(8.*sail-4.*flagTime)+.065*sin(17.*sail-5.3*flagTime+uv.y));transformed.y-=.17*sail*sail;`);
 };
 const cloth=this.mesh(new THREE.PlaneGeometry(1.55,.78,14,5),flagMaterial,this.flag);
 cloth.position.set(.79,4.49,0);cloth.castShadow=false;
 this.flag.position.copy(this.holePosition);this.root.add(this.flag);
 plantTrees(this,planting.trees,planting.species);
 if(name==='range')this.rangeTargets();else frameHole(this);
 horizon(this);ridgeBackdrop(this);plantMargins(this);teeBoard(this);
 for(const x of [-2.2,2.2]){
  const marker=this.mesh(new THREE.SphereGeometry(.16,14,8),this.mat(0xeee9d9));
  marker.position.set(x,this.groundHeight(x,70)+.15,70);marker.scale.y=.7;
 }
 if(name==='royal')this.clubhouse();return this;
 }
 rangeTargets(){
  for(const [yards,x,color] of [[50,-6,0xe7bd63],[100,7,0xd98566],[150,0,0x8bbacd],[200,-9,0xc691af],[250,8,0xe5d999]]){
   const z=70-Math.sqrt((yards/1.75)**2-x*x);
   this.surfaceEllipse(x,z,4.8,4.8,this.mat(color),.09,false,.86);
   const post=this.mesh(new THREE.CylinderGeometry(.08,.08,2.4,8),this.mat(0xe9ede7));
   post.position.set(x,1.2,z);
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#153b32';ctx.fillRect(0,0,256,96);
   ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='bold 68px sans-serif';ctx.fillText(String(yards),128,72);
   const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
   const sign=this.mesh(new THREE.PlaneGeometry(4.4,1.65),new THREE.MeshBasicMaterial({map}));
   sign.position.set(x,2.4,z);
   sign.userData.targetMap=map;
  }
 }
 clubhouse(){const pos=new THREE.Vector3(-70,this.groundHeight(-70,82)+1,80);const wall=this.mesh(new THREE.BoxGeometry(26,12,16),this.mat(0xd0c5a9));wall.position.copy(pos);wall.castShadow=true;const roof=this.mesh(new THREE.ConeGeometry(20,8,4),this.mat(0x334342));roof.rotation.y=Math.PI/4;roof.position.copy(pos).add(new THREE.Vector3(0,10,0));for(let i=-3;i<=3;i++){const window=this.mesh(new THREE.PlaneGeometry(1.7,3),this.mat(0x314c54,.2));window.position.copy(pos).add(new THREE.Vector3(i*3.3,1.3,8.03));}}
 lie(x,z){

  const inside=area=>((x-area.x)/area.rx)**2+((z-area.z)/area.rz)**2<1;
  if((this.current==='ocean'&&x>=shoreX(z))||this.water.some(inside))return 'WATER';
  if(this.bunkers.some(b=>{const u=(x-b.x)/b.rx,v=(z-b.z)/b.rz;return Math.hypot(u,v)<this.bunkerEdge(Math.atan2(v,u))}))return 'BUNKER';
  if(this.insideGreen(x,z,0))return 'GREEN';
  if(this.insideGreen(x,z,FRINGE_WIDTH))return 'FRINGE';
  if(z<=76&&z>=this.getGreenZ()&&Math.abs(x-this.fairwayX(z))<=this.station(z,2))return 'FAIRWAY';
  return 'ROUGH';
 }
 insideGreen(x,z,margin){
  const {x:gx,z:gz,rx,rz}=this.green;
  const u=(x-gx)/(rx+margin),v=(z-gz)/(rz+margin);
  return Math.hypot(u,v)<this.greenEdge(Math.atan2(v,u));
 }
 ground(x,z){if((x/8)**2+((z-70)/6)**2<=1)return this.groundHeight(x,z)+.05;const lie=this.lie(x,z);return this.groundHeight(x,z)+(lie==='ROUGH'?0:lie==='GREEN'?GREEN_LIFT:lie==='FRINGE'?FRINGE_LIFT:lie==='BUNKER'?.10:lie==='WATER'?.08:.045)}
}