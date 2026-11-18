import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL,fetchFile } from '@ffmpeg/util';

function floatsToInt16(src:Float32Array):Int16Array{
  const dst=new Int16Array(src.length);
  for(let i=0;i<src.length;i++){const x=Math.max(-1,Math.min(1,src[i]));dst[i]=x<0?Math.round(x*32768):Math.round(x*32767);}
  return dst;
}
export async function encodeMp3(buffer:AudioBuffer,onProgress:(msg:string)=>void):Promise<Blob>{
  onProgress('正在載入 MP3 編碼器…');
  // Split into a separately loaded ESM chunk for lighter initial load.
  const lame=await import('@breezystack/lamejs');
  onProgress('正在將音訊編碼為 MP3…');
  const encoder=new lame.Mp3Encoder(2,buffer.sampleRate,160);
  const chunks:Uint8Array[]=[];
  const L=buffer.getChannelData(0),R=buffer.getChannelData(Math.min(1,buffer.numberOfChannels-1));
  for(let pos=0;pos<L.length;pos+=1152){
    const left=floatsToInt16(L.subarray(pos,pos+1152)),right=floatsToInt16(R.subarray(pos,pos+1152));
    const data=encoder.encodeBuffer(left,right);
    if(data.length)chunks.push(Uint8Array.from(data));
    if(pos%(1152*32)===0){onProgress(`MP3 編碼 ${Math.round(pos/L.length*100)}%`);await new Promise(resolve=>setTimeout(resolve,0));}
  }
  const flush=encoder.flush();if(flush.length)chunks.push(Uint8Array.from(flush));
  return new Blob(chunks as BlobPart[],{type:'audio/mpeg'});
}

function supportedRecordingType():string{
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const type=types.find(t=>MediaRecorder.isTypeSupported(t));
  if(!type)throw new Error('目前瀏覽器不支援影片錄製，請用最新版 Chrome 或 Edge');
  return type;
}

export async function captureMovie(canvas:HTMLCanvasElement, audio:MediaStream, seconds:number,onProgress:(msg:string)=>void):Promise<{blob:Blob,format:'mp4'|'webm'}>{
  if(!canvas.captureStream||typeof MediaRecorder==='undefined')throw new Error('此瀏覽器不支援畫面錄製');
  const capture=canvas.captureStream(30);
  // Clone tracks so stopping the recording does not stop the user's live mixer.
  const tracks=[...capture.getVideoTracks(),...audio.getAudioTracks().map(t=>t.clone())];
  const combined=new MediaStream(tracks),mimeType=supportedRecordingType();
  const recorder=new MediaRecorder(combined,{mimeType,videoBitsPerSecond:3000000,audioBitsPerSecond:160000});
  const chunks:BlobPart[]=[];
  const promise=new Promise<Blob>((resolve,reject)=>{
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onerror=()=>reject(new Error('錄影發生錯誤'));
    recorder.onstop=()=>resolve(new Blob(chunks,{type:mimeType.split(';')[0]}));
  });
  recorder.start(1000);
  for(let elapsed=0;elapsed<seconds;elapsed++){
    onProgress(`正在錄製 3D 動畫與聲音：${elapsed+1} / ${seconds} 秒`);
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(recorder.state!=='inactive')recorder.stop();
  const blob=await promise;combined.getTracks().forEach(t=>t.stop());
  return {blob,format:mimeType.startsWith('video/mp4')?'mp4':'webm'};
}

let ffmpeg:FFmpeg|null=null;
async function getFfmpeg(onProgress:(msg:string)=>void){
  if(ffmpeg)return ffmpeg;
  onProgress('首次匯出 MP4：下載約 31 MB 影片轉檔核心…');
  const lib=new FFmpeg();
  lib.on('progress',({progress})=>{
    if(Number.isFinite(progress))onProgress(`影片轉檔中 ${Math.max(0,Math.min(100,Math.round(progress*100)))}%`);
  });
  // Single-thread core: compatible with regular GitHub Pages (no COOP/COEP requirement).
  const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
  await lib.load({
    coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),
    wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm'),
  });
  ffmpeg=lib;return lib;
}
export async function webmToMp4(blob:Blob,onProgress:(msg:string)=>void):Promise<Blob>{
  const lib=await getFfmpeg(onProgress);
  const key=Math.floor(Math.random()*1e8).toString(36);
  const input=`input-${key}.webm`,output=`output-${key}.mp4`;
  try{
    await lib.writeFile(input,await fetchFile(blob));
    onProgress('正在合成 MP4（編碼需要較多記憶體）…');
    const code=await lib.exec(['-i',input,'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',output]);
    if(code!==0)throw new Error(`轉檔處理失敗（${code}）`);
    const data=await lib.readFile(output);
    if(typeof data==='string')throw new Error('轉檔輸出格式錯誤');
    return new Blob([new Uint8Array(data)],{type:'video/mp4'});
  }finally{
    try{await lib.deleteFile(input);}catch{/* cleanup */}
    try{await lib.deleteFile(output);}catch{/* cleanup */}
  }
}
export function downloadBlob(blob:Blob,name:string){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
