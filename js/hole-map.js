const surfaceColors={
 WATER:[66,126,154],BUNKER:[223,195,145],GREEN:[144,181,109],
 FRINGE:[107,147,86],FAIRWAY:[80,128,75],
};

export class HoleMap {
 constructor(panel,canvas){
  this.panel=panel;
  this.canvas=canvas;
  this.context=canvas.getContext('2d');
  this.base=document.createElement('canvas');
  this.base.width=canvas.width/2;
  this.base.height=canvas.height/2;
 }

 build(world){
  const {hole,teePosition,holePosition}=world;
  const left=Math.min(...hole.route.map(row=>row[1]-row[2]),...world.water.map(pool=>pool.x-pool.rx),...world.bunkers.map(bunker=>bunker.x-bunker.rx))-12;
  const right=Math.max(...hole.route.map(row=>row[1]+row[2]),...world.water.map(pool=>pool.x+pool.rx),...world.bunkers.map(bunker=>bunker.x+bunker.rx))+12;
  const top=Math.min(holePosition.z-16,...world.water.map(pool=>pool.z-pool.rz));
  const bottom=teePosition.z+14;
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
  if(this.hole!==game.world.hole)this.build(game.world);
  const position=game.spectating?game.ball.position:game.position;
  const [x,y]=this.project(position.x,position.z);
  if(x===this.lastX&&y===this.lastY&&this.drawnHole===this.hole)return;
  this.lastX=x;this.lastY=y;this.drawnHole=this.hole;
  const ctx=this.context;
  ctx.drawImage(this.base,0,0,this.canvas.width,this.canvas.height);
  const [pinX,pinY]=this.pin;
  ctx.fillStyle='#ffe2a0';ctx.strokeStyle='#17261d';ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(pinX,pinY-6);ctx.lineTo(pinX+6,pinY);ctx.lineTo(pinX,pinY+6);ctx.lineTo(pinX-6,pinY);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();
  ctx.arc(Math.max(5,Math.min(this.canvas.width-5,x)),Math.max(5,Math.min(this.canvas.height-5,y)),4,0,Math.PI*2);
  ctx.fill();ctx.stroke();
 }
}
