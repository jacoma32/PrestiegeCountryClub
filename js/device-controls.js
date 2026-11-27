export function golfDevice(agent=navigator,coarsePointer=matchMedia('(any-pointer: coarse)').matches){
 const {userAgent,maxTouchPoints}=agent;
 const ipad=/iPad/i.test(userAgent)||(/Macintosh/i.test(userAgent)&&maxTouchPoints>1);
 const iphone=/iPhone|iPod/i.test(userAgent);
 return {
  name:ipad?'ipad':iphone?'iphone':'computer',
  touch:ipad||iphone||(maxTouchPoints>0&&coarsePointer),
 };
}

export function bindTouchGolf(game,{swing,left,right}){
 let pointer=null;
 swing.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||pointer!==null||game.charging)return;
  event.preventDefault();
  if(!game.startCharge())return;
  swing.setPointerCapture(event.pointerId);
  pointer=event.pointerId;
 });
 swing.addEventListener('pointerup',event=>{
  if(pointer!==event.pointerId)return;
  pointer=null;
  game.releaseShot();
 });
 const cancel=event=>{
  if(pointer!==event.pointerId)return;
  pointer=null;
  game.cancelCharge();
 };
 swing.addEventListener('pointercancel',cancel);
 swing.addEventListener('lostpointercapture',cancel);
 swing.addEventListener('click',event=>{
  if(event.detail!==0||pointer!==null)return;
  if(game.charging)game.releaseShot();
  else game.startCharge();
 });
 window.addEventListener('blur',()=>{pointer=null;game.cancelCharge()});
 left.addEventListener('click',()=>game.aimDelta(-2));
 right.addEventListener('click',()=>game.aimDelta(2));
}
