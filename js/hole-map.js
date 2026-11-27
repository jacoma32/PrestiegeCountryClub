const surfaceColors={
 WATER:[66,126,154],BUNKER:[223,195,145],GREEN:[144,181,109],
 FRINGE:[107,147,86],FAIRWAY:[80,128,75],
};

export class HoleMap {
 constructor(panel,canvas){
  this.panel=panel;
  this.canvas=canvas;
  this.readout=panel.querySelector('.map-prediction');
  this.context=canvas.getContext('2d');
  this.base=document.createElement('canvas');
  this.base.width=canvas.width/2;
  this.base.height=canvas.height/2;
 }

 build(world,path){
  const {hole,teePosition,holePosition}=world;
  let left=Math.min(...hole.route.map(row=>row[1]-row[2]),...world.water.map(pool=>pool.x-pool.rx),...world.bunkers.map(bunker=>bunker.x-bunker.rx))-12;
  let right=Math.max(...hole.route.map(row=>row[1]+row[2]),...world.water.map(pool=>pool.x+pool.rx),...world.bunkers.map(bunker=>bunker.x+bunker.rx))+12;
  let top=Math.min(holePosition.z-16,...world.water.map(pool=>pool.z-pool.rz));
  let bottom=teePosition.z+14;
  if(path){
   for(const point of path){
    left=Math.min(left,point.x-8);right=Math.max(right,point.x+8);
    top=Math.min(top,point.z-8);bottom=Math.max(bottom,point.z+8);
   }
  }
  const scale=Math.min(this.canvas.width/(right-left),this.canvas.height/(bottom-top));
  this.project=(x,z)=>[
   this.canvas.width/2+(x-(left+right)/2)*scale,
   this.canvas.height/2+(z-(top+bottom)/2)*scale,
  ];
  const ctx=this.base.getContext('2d');
  const {width,height}=this.base;
  const image=ctx.createImageData(width,height);
  const rough=world.current==='dunes'?[161,121,76]:[38,66,49];
  for(let row=0;row<height;row++){
   const z=(row*2-this.canvas.height/2)/scale+(top+bottom)/2;
   for(let column=0;column<width;column++){
    const x=(column*2-this.canvas.width/2)/scale+(left+right)/2;
    const [r,g,b]=surfaceColors[world.lie(x,z)]||rough;
    image.data.set([r,g,b,255],(row*width+column)*4);
   }
  }
  ctx.putImageData(image,0,0);
  this.hole=hole;
  this.pin=this.project(holePosition.x,holePosition.z);
 }

 update(game,playing){
  const visible=playing&&game.started&&game.course!=='range';
  if(this.panel.hidden===visible)this.panel.hidden=!visible;
  if(!visible||!this.context)return;
  const position=game.spectating?game.ball.position:game.position;
  const path=game.spectating||game.swinging||game.modal?null:game.predictedPath;
  if(this.hole!==game.world.hole)this.build(game.world,path);
  else if(path&&path!==this.lastPath&&path.some(point=>{
   const [px,py]=this.project(point.x,point.z);
   return px<4||py<4||px>this.canvas.width-4||py>this.canvas.height-4;
  }))this.build(game.world,path);
  const [x,y]=this.project(position.x,position.z);
  if(x===this.lastX&&y===this.lastY&&path===this.lastPath&&this.drawnHole===this.hole)return;
  this.lastX=x;this.lastY=y;this.lastPath=path;this.drawnHole=this.hole;
  const ctx=this.context;
  ctx.drawImage(this.base,0,0,this.canvas.width,this.canvas.height);
  this.readout.textContent=path?game.predictedResult:'';
  this.readout.hidden=!path;
  const [pinX,pinY]=this.pin;
  const ballX=Math.max(5,Math.min(this.canvas.width-5,x));
  const ballY=Math.max(5,Math.min(this.canvas.height-5,y));
  if(path?.length){
   ctx.beginPath();
   ctx.moveTo(...this.project(path[0].x,path[0].z));
   for(const point of path.slice(1))ctx.lineTo(...this.project(point.x,point.z));
   ctx.lineJoin='round';ctx.lineCap='round';
   ctx.strokeStyle='#17261d';ctx.lineWidth=6;ctx.stroke();
   ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
  }
  ctx.fillStyle='#ffe2a0';ctx.strokeStyle='#17261d';ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(pinX,pinY-6);ctx.lineTo(pinX+6,pinY);ctx.lineTo(pinX,pinY+6);ctx.lineTo(pinX-6,pinY);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();
  ctx.arc(ballX,ballY,4,0,Math.PI*2);
  ctx.fill();ctx.stroke();
  if(path?.length){
   const end=path.at(-1);
   const [endX,endY]=this.project(end.x,end.z);
   ctx.beginPath();ctx.arc(endX,endY,4.5,0,Math.PI*2);
   ctx.fillStyle='#17261d';ctx.fill();
   ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  }
 }
}
