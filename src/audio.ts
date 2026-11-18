import type { Track, TrackKind, Theme } from './types';

const INITIAL: Omit<Track,'buffer'>[] = [
  {id:'melody',name:'星光旋律',kind:'melody',emoji:'✦',color:'#8c78ff',volume:75,enabled:true},
  {id:'bass',name:'節奏低音',kind:'bass',emoji:'◈',color:'#ff70ad',volume:45,enabled:true},
  {id:'rain',name:'細雨白噪音',kind:'rain',emoji:'☂',color:'#54c8ff',volume:0,enabled:true},
  {id:'wind',name:'柔和風聲',kind:'wind',emoji:'≈',color:'#69e5c0',volume:24,enabled:true},
  {id:'bells',name:'魔法鈴聲',kind:'bells',emoji:'✧',color:'#f9c66a',volume:55,enabled:true},
];
const KEY_BY_THEME: Record<Theme,number[]> = {
  space:[0,2,4,7,9,11,12,9,7,4,2,7,9,4,2,0],
  ocean:[0,4,7,9,7,4,2,4,0,2,4,7,9,7,4,2],
  forest:[0,2,4,7,11,7,4,2,0,7,9,11,9,7,4,2],
  city:[0,3,7,10,12,10,7,3,0,7,10,12,15,12,10,7],
};

function noiseBuffer(ctx: BaseAudioContext, seconds=3): AudioBuffer {
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate);
  const data=buffer.getChannelData(0);
  // Seeded to keep ambience consistent between offline MP3 and live playback.
  let seed=19473;
  for(let i=0;i<data.length;i++){seed=(Math.imul(1664525,seed)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}
  return buffer;
}

function launchNoise(ctx: BaseAudioContext, destination:AudioNode, kind:'rain'|'wind', at=0):AudioBufferSourceNode {
  const noise=ctx.createBufferSource();noise.buffer=noiseBuffer(ctx);noise.loop=true;
  const filter=ctx.createBiquadFilter();filter.type=kind==='rain'?'lowpass':'bandpass';
  filter.frequency.value=kind==='rain'?2400:380;
  filter.Q.value=kind==='rain'?0.22:0.44;
  const level=ctx.createGain();level.gain.value=kind==='rain'?0.29:0.7;
  noise.connect(filter).connect(level).connect(destination);
  noise.start(at);return noise;
}

function frequency(midi:number){return 440*Math.pow(2,(midi-69)/12);}

function tone(ctx:BaseAudioContext,destination:AudioNode,kind:'melody'|'bass'|'bells',note:number,at:number,length:number):void {
  const osc=ctx.createOscillator();
  osc.type=kind==='bass'?'triangle':kind==='bells'?'sine':'sine';
  osc.frequency.setValueAtTime(frequency(note),at);
  const envelope=ctx.createGain();const peak=kind==='bass'?0.20:kind==='bells'?0.12:0.18;
  const attack=kind==='bells'?0.008:0.018;
  envelope.gain.setValueAtTime(0.0001,at);
  envelope.gain.exponentialRampToValueAtTime(peak,at+attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001,at+length);
  osc.connect(envelope).connect(destination);
  osc.start(at);osc.stop(at+length+0.02);
  // soft upper harmonic makes it sound less like a plain beep
  if(kind==='melody'){
    const o2=ctx.createOscillator(), g2=ctx.createGain();o2.type='triangle';
    o2.frequency.value=frequency(note)*2;g2.gain.value=0.035;
    o2.connect(g2).connect(envelope);o2.start(at);o2.stop(at+length+0.02);
  }
}

export class AudioEngine {
  readonly context = new AudioContext();
  readonly master=this.context.createGain();
  readonly analyser=this.context.createAnalyser();
  readonly recording=this.context.createMediaStreamDestination();
  tracks:Track[]=[];
  bpm=90;
  theme:Theme='space';
  playing=false;
  private nodes=new Map<string,GainNode>();
  private ambient:AudioBufferSourceNode[]=[];
  private interval:number|null=null;
  private nextTime=0;
  private beat=0;
  private nextUploadId=1;
  private lastSpectrum=new Uint8Array(128);

  constructor(){
    this.master.gain.value=0.85;
    this.analyser.fftSize=256;this.analyser.smoothingTimeConstant=0.82;
    this.master.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    this.analyser.connect(this.recording);
    INITIAL.forEach(t=>this.addTrack({...t}));
  }
  get spectrum():Uint8Array{this.analyser.getByteFrequencyData(this.lastSpectrum as Uint8Array<ArrayBuffer>);return this.lastSpectrum;}
  get mediaStream():MediaStream{return this.recording.stream;}
  setMaster(volume:number){this.master.gain.setTargetAtTime(volume/100,this.context.currentTime,0.025);}
  addTrack(track:Track){this.tracks.push(track);const g=this.context.createGain();g.connect(this.master);this.nodes.set(track.id,g);this.updateGain(track.id);}
  updateGain(id:string){const track=this.tracks.find(t=>t.id===id),node=this.nodes.get(id);if(track&&node)node.gain.setTargetAtTime(track.enabled?track.volume/100:0,this.context.currentTime,0.035);}
  setVolume(id:string,value:number){const t=this.tracks.find(t=>t.id===id);if(!t)return;t.volume=Math.max(0,Math.min(100,value));this.updateGain(id);}
  toggle(id:string){const t=this.tracks.find(t=>t.id===id);if(!t)return;t.enabled=!t.enabled;this.updateGain(id);}
  setBpm(n:number){this.bpm=Math.max(50,Math.min(170,n));}
  setTheme(theme:Theme){this.theme=theme;}
  async addFile(file:File):Promise<Track>{
    if(file.size>30*1024*1024)throw new Error('音檔請小於 30 MB');
    const buffer=await this.context.decodeAudioData(await file.arrayBuffer());
    if(buffer.duration>180)throw new Error('音檔最長 3 分鐘，請先裁切再上傳');
    const id='upload-'+this.nextUploadId++;
    const t:Track={id,name:file.name.replace(/\.[^.]+$/,'').slice(0,24),kind:'upload',emoji:'♫',color:'#a1e3ff',volume:70,enabled:true,buffer};
    this.addTrack(t);
    if(this.playing)this.playUploadedTrack(t);
    return t;
  }
  remove(id:string){const t=this.tracks.find(x=>x.id===id);if(!t||t.kind!=='upload')return;this.tracks=this.tracks.filter(x=>x.id!==id);this.nodes.get(id)?.disconnect();this.nodes.delete(id);this.restartIfPlaying();}
  private playUploadedTrack(t:Track){if(!t.buffer)return;const n=this.context.createBufferSource();n.buffer=t.buffer;n.loop=true;n.connect(this.nodes.get(t.id)!);n.start();this.ambient.push(n);}
  private createAmbience(){
    for(const kind of ['rain','wind'] as const){const dest=this.nodes.get(kind);if(dest)this.ambient.push(launchNoise(this.context,dest,kind));}
    this.tracks.filter(t=>t.kind==='upload').forEach(t=>this.playUploadedTrack(t));
  }
  private schedule(){
    while(this.nextTime<this.context.currentTime+0.16){
      this.scheduleBeat(this.context,this.nodes,this.beat,this.nextTime);
      this.nextTime+=60/this.bpm/2;
      this.beat++;
    }
  }
  private scheduleBeat(ctx:BaseAudioContext,nodes:Map<string,GainNode>,beat:number,at:number){
    const scale=KEY_BY_THEME[this.theme];
    tone(ctx,nodes.get('melody')!,'melody',60+scale[beat%scale.length],at,Math.min(0.48,60/this.bpm/2*0.9));
    if(beat%4===0)tone(ctx,nodes.get('bass')!,'bass',36+scale[(Math.floor(beat/4)*4)%scale.length]%12,at,0.36);
    if(beat%4===2)tone(ctx,nodes.get('bells')!,'bells',72+scale[(beat+3)%scale.length],at,0.45);
  }
  async play(){
    if(this.playing)return;
    await this.context.resume();
    this.playing=true;this.createAmbience();
    this.beat=0;this.nextTime=this.context.currentTime+0.08;
    this.interval=window.setInterval(()=>this.schedule(),70);this.schedule();
  }
  stop(){
    if(!this.playing)return;
    this.playing=false;
    if(this.interval!==null){clearInterval(this.interval);this.interval=null;}
    this.ambient.forEach(n=>{try{n.stop();}catch{ /* source already stopped */ } });this.ambient=[];
    // The short pre-scheduled notes finish naturally; avoid a suspend/play race.
  }
  private restartIfPlaying(){if(this.playing){this.stop();void this.play();}}

  async renderOffline(seconds:number):Promise<AudioBuffer>{
    const sampleRate=44100;
    const ctx=new OfflineAudioContext(2,Math.round(sampleRate*seconds),sampleRate);
    const master=ctx.createGain();master.gain.value=this.master.gain.value;master.connect(ctx.destination);
    const nodes=new Map<string,GainNode>();
    for(const t of this.tracks){
      const g=ctx.createGain();g.gain.value=t.enabled?t.volume/100:0;g.connect(master);nodes.set(t.id,g);
    }
    for(const kind of ['rain','wind'] as const){const dest=nodes.get(kind);if(dest)launchNoise(ctx,dest,kind,0);}
    for(const t of this.tracks){if(t.buffer&&t.kind==='upload'){
      const player=ctx.createBufferSource();player.buffer=t.buffer;player.loop=true;player.connect(nodes.get(t.id)!);player.start(0);
    }}
    let step=0;
    for(let at=0;at<seconds;at+=60/this.bpm/2){this.scheduleBeat(ctx,nodes,step++,at);}
    return await ctx.startRendering();
  }
}
