// Recorded strike sources and editing notes are in assets/audio/CREDITS.md.
export class SoundEngine {
 constructor(){this.ctx=null;this.enabled=false;this.hits=new Map();this.loadingHits=null;this.puttIndex=0;}
 async setEnabled(enabled, preview = false) {
  this.enabled = enabled;
  if (!enabled) return;
  try {
   if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
   await this.ctx.resume();
   if (!this.enabled) return;
   this.loadHits();
   if (preview) this.play('welcome');
  } catch (error) {
   this.enabled = false;
   throw error;
  }
 }
 loadHits(){
  if(this.loadingHits)return this.loadingHits;
  const files=['drive','putt-a','putt-b'].filter(key=>!this.hits.has(key));
  this.loadingHits=Promise.allSettled(files.map(async key=>{
   const response=await fetch(new URL('../assets/audio/'+key+'.wav',import.meta.url));
   if(!response.ok)throw Error('Impact audio unavailable');
   const buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());
   this.hits.set(key,buffer);
  })).finally(()=>{this.loadingHits=null});
  return this.loadingHits;
 }
 recordedStrike(club,power,lie){
  const putt=club==='putter',key=putt?(this.puttIndex%2?'putt-b':'putt-a'):'drive';
  const buffer=this.hits.get(key)||(putt&&(this.hits.get('putt-a')||this.hits.get('putt-b')));
  if(!buffer)return false;
  if(putt)this.puttIndex++;
  const ctx=this.ctx,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  const [pitch,cutoff,level]=({driver:[1,15500,.94],wood:[.94,9900,.85],hybrid:[.89,7200,.78],putter:[1,9500,.46]})[club]||
   (club.startsWith('iron')?[1.07,6500,.76]:[.98,4900,.60]);
  source.buffer=buffer;source.playbackRate.value=pitch*(.98+Math.random()*.04);
  filter.type='lowpass';filter.Q.value=.65;filter.frequency.value=cutoff*(.55+.45*power)*(lie==='BUNKER'?.64:lie==='ROUGH'?.83:1);
  gain.gain.value=level*(.12+.88*power**.8);
  source.connect(filter).connect(gain).connect(ctx.destination);source.start();
  return true;
 }
 tone(freq,duration=.16,type='sine',gain=.055,offset=0){if(!this.enabled||!this.ctx)return;const c=this.ctx,osc=c.createOscillator(),vol=c.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,c.currentTime+offset);vol.gain.setValueAtTime(.0001,c.currentTime+offset);vol.gain.exponentialRampToValueAtTime(gain,c.currentTime+offset+.015);vol.gain.exponentialRampToValueAtTime(.0001,c.currentTime+offset+duration);osc.connect(vol).connect(c.destination);osc.start(c.currentTime+offset);osc.stop(c.currentTime+offset+duration+.03)}
 // Air displaced by the head: a rising band of noise, followed by a short trailing breath.
 whoosh(club,power){
  const c=this.ctx,rate=c.sampleRate,duration=.215;
  const buffer=c.createBuffer(1,Math.ceil(rate*duration),rate),data=buffer.getChannelData(0);
  const gain=(club==='putter'?.012:['driver','wood','hybrid'].includes(club)?.40:.26)*(.18+.82*power);
  let fast=0,slow=0;
  for(let i=0;i<data.length;i++){
   const u=i/data.length,air=Math.random()*2-1,sweep=Math.min(1,u/.72);
   const center=400+(1100+1350*power)*sweep*sweep;
   fast+=(air-fast)*(1-Math.exp(-2*Math.PI*center*1.9/rate));
   slow+=(air-slow)*(1-Math.exp(-2*Math.PI*center*.45/rate));
   const envelope=u<.72?sweep*sweep:Math.pow((1-u)/.28,2);
   data[i]=gain*(fast-slow)*envelope;
  }
  this.sample(buffer);
 }
 strike(club,power,lie){
  if(this.recordedStrike(club,power,lie))return;
  // Head-body resonance, face snap, ball compression and a delayed brush of ground.
  const wood=['driver','wood','hybrid'].includes(club),putt=club==='putter';
  const profile={driver:[720,2480,.046],wood:[580,1840,.032],hybrid:[490,1530,.026],putter:[320,950,.012]};
  const [bodyHz,faceHz,tail]=profile[club]||[555,1940,.020];
  const rate=this.ctx.sampleRate,buffer=this.ctx.createBuffer(1,Math.ceil(rate*.16),rate);
  const data=buffer.getChannelData(0),pitch=.96+Math.random()*.08;
  const brush=putt?0:lie==='BUNKER'?.42:lie==='ROUGH'?.27:wood?.045:.17;
  let low=0,mid=0,previous=0;
  for(let i=0;i<data.length;i++){
   const t=i/rate,n=Math.random()*2-1;
   low+=(n-low)*(1-Math.exp(-8500/rate));mid+=(n-mid)*(1-Math.exp(-31000/rate));
   const snap=(mid-previous)*Math.exp(-t/.0032)*(putt?.25:.78);
   const knock=(.32*Math.sin(6.283*bodyHz*pitch*t)+.55*low)*Math.exp(-t/.013);
   const face=(.12*Math.sin(6.283*faceHz*pitch*t)+.05*Math.sin(6.283*faceHz*1.67*pitch*t))*Math.exp(-t/tail);
   const contact=(mid-low)*Math.exp(-t/(wood?.010:.016))*.45;
   const after=t-.009,ground=after>0?brush*low*Math.min(1,after/.005)*Math.exp(-after/.025):0;
   data[i]=Math.tanh((snap+knock+face+contact+ground)*1.5)*(.20+.74*power)*(putt?.57:1)*Math.min(1,t/.00018);
   previous=mid;
  }
  this.sample(buffer);
 }
 sample(buffer){const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.ctx.destination);source.start()}
 splash(speed){
  const c=this.ctx,rate=c.sampleRate,buffer=c.createBuffer(1,Math.floor(rate*.52),rate);
  const data=buffer.getChannelData(0);let smooth=0;
  for(let i=0;i<data.length;i++){
   const t=i/rate;smooth+=((Math.random()*2-1)-smooth)*(.12+.28*Math.exp(-t/.15));
   data[i]=(.46*smooth*Math.exp(-t/.14)+.2*Math.sin(6.283*(180*t-100*t*t))*Math.exp(-t/.046))*Math.min(1,t/.005)*Math.min(1,.35+speed/35);
  }this.sample(buffer);
 }
 play(event,detail={}){if(!this.enabled)return;switch(event){case 'whoosh':this.whoosh(detail.club,detail.power);break;case 'strike':this.strike(detail.club,detail.power,detail.lie);break;case 'land':this.tone(110,.14,'sine',.05);break;case 'cup':for(let i=0;i<3;i++)this.tone([523,659,784][i],.22,'sine',.055,i*.11);break;case 'hazard':this.splash(detail.speed||12);break;case 'welcome':this.tone(440,.13,'sine',.025);this.tone(554,.18,'sine',.025,.1);break;case 'menu':this.tone(400,.045,'sine',.012);break;}}
}