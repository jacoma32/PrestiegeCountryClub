import * as T from 'three';

const species={range:'oak',royal:'oak',ocean:'cypress',summit:'pine',misty:'pine'};

function pathCenter(world,z){
 const t=(80-z)/(world.length+26),side=world.current==='ocean'?-1:(world.holeIndex%2?-1:1);
 const shoulder=13+3*Math.sin(t*7+world.holeIndex)+2*Math.cos(t*12);
 return world.fairwayX(z)+side*(world.station(z,2)+shoulder);
}

export function landscape(world){
 const {current,holeIndex,length}=world,coast=current==='ocean',park=current==='royal'||current==='range',alpine=current==='misty',desert=current==='dunes';
 let seed=(holeIndex+1)*7937+current.charCodeAt(0)*73;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const trees=[],stones=[],grasses=[];
 function rough(x,z,margin=0){
  return (current==='range'||Math.abs(x-pathCenter(world,z))>2.7)&&Math.abs(x-world.fairwayX(z))>world.station(z,2)+margin&&world.lie(x,z)==='ROUGH'&&
   Math.hypot(x-world.green.x,z-world.green.z)>Math.max(world.green.rx,world.green.rz)+margin+2&&
   (!coast||x<36);
 }
 // Place stands along the outside of bends and around the back of the green.
 // Each stand graduates from low edge planting to taller trees at its center.
 const groups=desert?0:coast?19:park?34:46;
 for(let i=0;i<groups;i++){
  const t=(i+random())/groups,side=coast?-1:(i%2?1:-1);
  const z=85-t*(length+48),w=world.station(z,2);
  const cx=world.fairwayX(z)+side*(w+14+random()*39),radius=coast?11:12+random()*11;
  const height=(park?11:alpine?10:13)+random()*5,stand=[];
  for(let j=0;j<(coast?8:park?12:15);j++){
   const a=random()*Math.PI*2,r=Math.sqrt(random()),x=cx+Math.cos(a)*radius*r,pz=z+Math.sin(a)*radius*r*1.45;
   if(!rough(x,pz,8)||stand.some(v=>Math.hypot(v[0]-x,v[1]-pz)<4.8))continue;
   stand.push([x,pz,height*(1-.39*r)+random()*3,random()]);
  }
  if(stand.length>=3)trees.push(...stand);
 }
 const patches=desert?53:coast?105:park?57:85;
 for(let i=0;i<patches;i++){
  const z=80-random()*(length+28),side=random()<.5?-1:1;
  const x=world.fairwayX(z)+side*(world.station(z,2)+3+random()*24);
  const outcrop=!park&&random()<(desert?.63:alpine?.40:coast?.20:.26);
  for(let j=0;j<(outcrop?5:21);j++){
   const px=x+(random()-.5)*9,pz=z+(random()-.5)*8;
   if(!rough(px,pz,1.6))continue;
   const scale=outcrop?.42+random()*.95:(coast?.58:park?.25:.40)+random()*.40;
   (outcrop?stones:grasses).push([px,pz,scale,random()]);
  }
 }
 const blades=new T.BufferGeometry(),vertices=[];
 for(let i=0;i<17;i++){
  const a=i*2.39996,r=.45*Math.sqrt(i/17),x=r*Math.cos(a),z=r*Math.sin(a),w=.025+.035*random();
  vertices.push(x-w,0,z,x+w,0,z,x*1.7,.27+.48*random(),z*1.7);
 }
 blades.setAttribute('position',new T.Float32BufferAttribute(vertices,3));blades.computeVertexNormals();
 const rock=new T.IcosahedronGeometry(1,1);
 function scatter(items,geometry,color,isRock){
  const mat=new T.MeshStandardMaterial({color,roughness:.97,flatShading:isRock,side:isRock?T.FrontSide:T.DoubleSide});
  const batch=new T.InstancedMesh(geometry,mat,items.length),pose=new T.Object3D(),shade=new T.Color();
  items.forEach(([x,z,size,v],i)=>{
   pose.position.set(x,world.groundHeight(x,z)+(isRock?size*.10:.015),z);
   pose.rotation.set(isRock?v*.34:0,v*6.28,isRock?v*.25:0);
   pose.scale.set(size*(isRock?1.65:1),size*(isRock?.58:1),size);pose.updateMatrix();
   batch.setMatrixAt(i,pose.matrix);batch.setColorAt(i,shade.setScalar(.68+.32*v));
  });
  batch.receiveShadow=true;world.root.add(batch);
 }
 scatter(grasses,blades,desert?0x8e8c53:coast?0xc1ad70:park?0x829343:0x899154,false);
 scatter(stones,rock,desert?0x975e3a:coast?0x827c67:alpine?0x8b8391:0x87918b,true);
 if(desert){
  const locations=[];
  for(let i=0;i<38;i++){
   const z=76-random()*(length+26),side=i%2?-1:1;
   const x=world.fairwayX(z)+side*(world.station(z,2)+6+random()*49);
   if(rough(x,z,4))locations.push([x,z,1.7+random()*2.6,random()*Math.PI*2]);
  }
  plantCacti(world,locations);
 }
 return {trees,species:species[current]};
}

function plantCacti(world,locations){
 if(!locations.length)return;
 const geometry=new T.CapsuleGeometry(.5,1,4,9);
 const material=new T.MeshStandardMaterial({color:0x53673b,roughness:.88});
 const pieces=[
  [0,.5,.13,.5,0],
  [-.10,.43,.09,.11,Math.PI/2],
  [-.20,.55,.085,.16,0],
  [.11,.59,.09,.12,Math.PI/2],
  [.22,.68,.08,.13,0],
 ];
 const batch=new T.InstancedMesh(geometry,material,locations.length*pieces.length);
 const pose=new T.Object3D(),tint=new T.Color();
 locations.forEach(([x,z,height,angle],index)=>{
  const ground=world.groundHeight(x,z);
  pieces.forEach(([offset,y,width,length,tilt],piece)=>{
   pose.position.set(x+Math.cos(angle)*offset*height,ground+y*height,z-Math.sin(angle)*offset*height);
   pose.rotation.set(0,angle,tilt,'YXZ');
   pose.scale.set(width*height,length*height,width*height);
   pose.updateMatrix();
   const instance=index*pieces.length+piece;
   batch.setMatrixAt(instance,pose.matrix);
   batch.setColorAt(instance,tint.setScalar(.78+.22*Math.sin(angle/2)));
  });
 });
 batch.castShadow=true;batch.receiveShadow=true;world.root.add(batch);
}

export function fairwayCollar(world,material){
 const positions=[],uv=[],indices=[],segments=150;
 for(const side of [-1,1]){
  const base=positions.length/3;
  for(let i=0;i<=segments;i++){
   const z=70-world.length*i/segments,w=world.station(z,2),center=world.fairwayX(z);
   for(const extra of [0,1.9]){
    const x=center+side*(w+extra);positions.push(x,world.groundHeight(x,z)+.029,z);uv.push(x*.032,z*.032);
   }
   if(i<segments){const a=base+i*2;if(side>0)indices.push(a,a+1,a+2,a+1,a+3,a+2);else indices.push(a,a+2,a+1,a+1,a+2,a+3)}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();material.side=T.DoubleSide;world.mesh(g,material).castShadow=false;
}

export function sandFinish(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 sandPoint;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nsandPoint=(modelMatrix*vec4(transformed,1.)).xyz;');
  shader.fragmentShader='varying vec3 sandPoint;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 sp=sandPoint.xz;
   float ridges=sin(31.*(sp.x*.78+sp.y*.32)+1.8*sin(sp.y*.42));
   float grain=fract(sin(dot(floor(sp*65.),vec2(7.31,21.37)))*14371.);
   diffuseColor.rgb*=.96+.045*ridges*(1.-smoothstep(.02,.20,length(fwidth(sp))))+.055*(grain-.5);
  `);
 };
}

export function cartPath(world){
 const coastal=world.current==='ocean';
 const vertices=[],indices=[],colors=[],steps=150;
 const tint=new T.Color(coastal?0xb8ad91:world.current==='royal'?0x8e8b78:world.current==='dunes'?0xad865e:0x938e80);
 let previous=false;
 for(let i=0;i<=steps;i++){
  const t=i/steps,z=80-(world.length+26)*t;
  const x=pathCenter(world,z);
  const width=coastal?1.03:1.25;
  const clear=[-width,0,width].every(k=>world.lie(x+k,z)==='ROUGH'&&
   Math.hypot(x+k-world.green.x,z-world.green.z)>Math.max(world.green.rx,world.green.rz)+2);
  for(const [offset,shade] of [[-width,.77],[-width+.19,.96],[width-.19,1],[width,.78]]){
   const px=x+offset;vertices.push(px,world.groundHeight(px,z)+.048,z);
   colors.push(tint.r*shade,tint.g*shade,tint.b*shade);
  }
  if(i&&clear&&previous)for(let j=0;j<3;j++){
   const k=(i-1)*4+j;indices.push(k,k+1,k+4,k+1,k+5,k+4);
  }
  previous=clear;
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
 const path=world.mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));
 path.castShadow=false;
}
