import './style.css';
import { AudioEngine } from './audio';
import { SoundStage } from './scene';
import { presets,parsePrompt } from './presets';
import { captureMovie,downloadBlob,encodeMp3,webmToMp4 } from './export';
import type { Preset,Theme,Track } from './types';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const safe=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const app=$<HTMLElement>('app');
app.innerHTML=`
  <div class="app-layout">
    <aside class="sidebar left-sidebar">
      <div class="brand"><span class="brand-mark"><span>◉</span></span><div><strong>SoundScape</strong><small>STUDIO / EDUCATION</small></div></div>
      <div class="sidebar-scroll">
        <div class="tiny-section"><span class="overline">CREATIVE TOOLKIT</span><h1>讓想像，<br><em>變成聲音。</em></h1><p>輸入一段描述，打造自己的 3D 互動音景。動手調整聲音，讓畫面跟著節奏律動。</p></div>
        <div class="section-divider"></div>
        <div class="minor-title">01 <span>靈感範本</span></div>
        <div class="preset-list">
          <button class="preset-card selected" data-theme="space"><span class="preset-symbol cosmic">✦</span><span><strong>星際漫遊</strong><small>SPACE · 夢幻電子</small></span><span class="chev">›</span></button>
          <button class="preset-card" data-theme="ocean"><span class="preset-symbol aquatic">≈</span><span><strong>深海夢境</strong><small>OCEAN · 放鬆環境</small></span><span class="chev">›</span></button>
          <button class="preset-card" data-theme="forest"><span class="preset-symbol leafy">♣</span><span><strong>魔法森林</strong><small>FOREST · 自然輕快</small></span><span class="chev">›</span></button>
          <button class="preset-card" data-theme="city"><span class="preset-symbol neon">▥</span><span><strong>霓虹城市</strong><small>CITY · 電子節奏</small></span><span class="chev">›</span></button>
        </div>
        <div class="section-divider"></div>
        <div class="minor-title">02 <span>作品背景</span></div>
        <label class="upload-zone" for="bg-input"><span class="upload-graphic">▧</span><strong>上傳圖片 / 影片</strong><small>JPG、PNG、WEBP、MP4、WEBM</small><span class="upload-action">選擇檔案 +</span></label>
        <input id="bg-input" class="visually-hidden" type="file" accept="image/*,video/mp4,video/webm" />
        <div class="bg-file"><span id="bg-name">尚未上傳背景</span><button id="bg-clear" title="移除背景" aria-label="移除背景">×</button></div>
        <p class="helper">圖片及影片僅在此瀏覽器中使用，不會自動上傳到網路。</p>
      </div>
      <div class="sidebar-bottom"><div class="tip-symbol">?</div><div><strong>課堂小挑戰</strong><small>試著創作一場「雨中的星際派對」，並讓雨聲和旋律平衡。</small></div></div>
    </aside>

    <main class="center-pane">
      <header class="topbar"><div class="breadcrumb"><span>創作工作室</span><b>/</b><strong>我的第一個 3D 音景</strong></div><span class="state-pill"><span class="green-dot"></span> LOCAL WEB AUDIO</span></header>
      <div class="center-scroll">
        <div class="page-heading"><div><span class="overline colored">INTERACTIVE SOUND PLAYGROUND</span><h2>你的 3D 聲音世界 <span>✳</span></h2><p>用文字描述場景、編輯混音、點擊 3D 光球切換音軌。</p></div><div class="edition">CREATOR MODE<br><strong>01 / 03</strong></div></div>
        <div class="stage-shell">
          <div class="stage-top"><div class="stage-title"><span class="live-signal"><i></i><i></i><i></i></span><span id="scene-title">星際漫遊</span></div><div class="stage-actions"><span class="hd-mark">3D LIVE VIEW</span><button id="reset-view" class="subtle-button">↺ 恢復預設</button></div></div>
          <div class="stage" id="stage"><div class="stage-badge"><span class="pulse-dot"></span> REAL-TIME VISUALIZER</div><div id="stage-tip" class="stage-tooltip" hidden></div><div class="stage-foot"><span>✦ 點擊彩色光球可開關音軌</span><span>THREE.JS + WEB AUDIO</span></div></div>
          <div class="transport"><button class="play-btn" id="play-btn" aria-label="播放"><span id="play-icon">▶</span></button><div class="transport-info"><strong id="transport-title">準備好創作了嗎？</strong><small id="transport-description">按下播放，讓聲音與畫面同步運作</small></div><div class="sound-waves" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="clock-readout" id="clock">00:00</span></div>
        </div>
        <section class="prompt-box"><div class="block-title"><div class="block-icon">✧</div><div><h3>提示詞創作</h3><p>03 個步驟：描述畫面 → 生成音景 → 微調混音</p></div><span class="tag">PROMPT TO SCENE</span></div>
          <label class="prompt-label" for="prompt">你想創造什麼樣的聲音世界？</label>
          <textarea id="prompt" rows="3" placeholder="例如：夜晚的魔法森林，輕柔的雨聲，偶爾傳來鈴聲，慢速的鋼琴旋律…">在浩瀚宇宙裡漂浮，星星閃爍，緩慢的旋律與清脆鈴聲</textarea>
          <div class="prompt-footer"><div class="prompt-hint">試試：<button data-fill="深海世界，海風輕吹，慢速柔和旋律">深海</button><button data-fill="夜晚森林，下雨聲和清脆鈴聲，速度 96 BPM">雨林</button><button data-fill="霓虹城市，快節奏電子樂與強烈低音，132 BPM">電音</button></div><button id="generate" class="generate-btn"><span>✦</span> 生成我的音景 <span>→</span></button></div>
          <p class="prompt-notice">教學版：使用本機關鍵字規則解讀提示詞，無須 AI API 金鑰。可辨識場景、速度 BPM 及雨、風、鈴聲、低音等聲音指令。</p>
        </section>
        <section class="lesson-row"><div><span class="lesson-dot">1</span><div><strong>描述場景</strong><small>設定空間與情緒</small></div></div><span class="lesson-line"></span><div><span class="lesson-dot">2</span><div><strong>混合音軌</strong><small>調整節奏及音量</small></div></div><span class="lesson-line"></span><div><span class="lesson-dot">3</span><div><strong>輸出作品</strong><small>MP3 / MP4 分享</small></div></div></section>
      </div>
    </main>

    <aside class="sidebar right-sidebar"><div class="right-head"><span class="overline colored">AUDIO WORKSPACE</span><h2>混音控制台</h2><p>即時調整聲音，打造專屬氛圍。</p></div><div class="right-scroll">
      <div class="control-heading"><span>聲音軌道</span><span id="track-count">05 TRACKS</span></div>
      <div id="track-list" class="track-list"></div>
      <label class="add-audio" for="audio-input"><span>＋</span> 匯入自己的音樂或音效 <small>MP3 / WAV / M4A</small></label>
      <input id="audio-input" class="visually-hidden" type="file" accept="audio/*" multiple />
      <div class="section-divider"></div>
      <div class="control-heading"><span>節奏與音量</span><span>MASTER</span></div>
      <div class="knob-row"><div><label for="bpm">音樂速度</label><small>BEATS PER MINUTE</small></div><output id="bpm-value">90 BPM</output></div>
      <input id="bpm" type="range" min="50" max="170" value="90" />
      <div class="range-ends"><span>50 慢速</span><span>170 快速</span></div>
      <div class="knob-row master-label"><div><label for="master">主音量</label><small>MASTER VOLUME</small></div><output id="master-value">85%</output></div>
      <input id="master" type="range" min="0" max="100" value="85" />
      <div class="monitor"><div class="monitor-top"><span>OUTPUT LEVEL</span><span id="monitor-value">0%</span></div><div class="monitor-track"><div id="monitor-bar"></div></div></div>
      <div class="section-divider"></div>
      <div class="control-heading"><span>輸出你的作品</span><span>EXPORT</span></div>
      <label class="duration-label" for="duration">輸出長度</label><select id="duration"><option value="10">10 秒 · 快速預覽</option><option value="20" selected>20 秒 · 完整作品</option><option value="30">30 秒 · 長版作品</option></select>
      <div class="export-grid"><button id="export-mp3" class="export-btn"><strong>♫</strong><span>MP3<small>純音樂</small></span></button><button id="export-mp4" class="export-btn accent"><strong>▣</strong><span>MP4<small>3D 影片＋聲音</small></span></button></div>
      <p class="export-note">MP3 由混音離線生成。MP4 需即時錄製並可能下載轉檔模組；建議使用桌面版 Chrome / Edge。</p>
      <div class="status-box" id="status" role="status" aria-live="polite"><span class="status-dot"></span><span id="status-text">系統已就緒，可開始創作</span></div>
    </div><div class="right-footer">SOUNDSCAPE LAB <span>© 2026</span></div></aside>
  </div>`;

const audio=new AudioEngine();
let currentPreset:Preset=structuredClone(presets.space);
let busy=false;
let elapsed=0;
let lastTick=performance.now();
const stage=new SoundStage($('stage'),()=>audio.spectrum,id=>{
  audio.toggle(id);renderTracks();stage.setTracks(audio.tracks);
  status('已切換 3D 光球音軌');
},name=>{
  const tip=$('stage-tip');tip.hidden=!name;tip.textContent=name?`點擊切換 · ${name}`:'';
});

function status(message:string,error=false){
  $('status-text').textContent=message;
  $('status').classList.toggle('error',error);
}
function setBusy(value:boolean){busy=value;for(const id of ['export-mp3','export-mp4','generate','bg-input','audio-input']){
  ($(id) as HTMLButtonElement|HTMLInputElement).disabled=value;
}}
function renderTracks(){
  $('track-count').textContent=`${String(audio.tracks.length).padStart(2,'0')} TRACKS`;
  $('track-list').innerHTML=audio.tracks.map((t:Track)=>`
    <div class="track ${t.enabled?'':'muted'}" data-track="${safe(t.id)}">
      <div class="track-top"><span class="track-emoji" style="--track-color:${t.color}">${t.emoji}</span><span class="track-name">${safe(t.name)}<small>${t.kind==='upload'?'YOUR AUDIO':'SYNTH SOUND'}</small></span><button class="mute-button" data-toggle="${safe(t.id)}" title="切換靜音" aria-label="切換 ${safe(t.name)} 靜音">${t.enabled?'◉':'◌'}</button>${t.kind==='upload'?`<button class="remove-button" data-remove="${safe(t.id)}" title="移除音軌">×</button>`:''}</div>
      <div class="track-bottom"><input aria-label="${safe(t.name)} 音量" data-volume="${safe(t.id)}" type="range" min="0" max="100" value="${t.volume}" style="--track-color:${t.color}" /><output>${t.volume}%</output></div>
    </div>`).join('');
}
function setPreset(p:Preset){
  currentPreset=p;audio.setTheme(p.theme);audio.setBpm(p.bpm);stage.setTheme(p.theme);
  for(const t of audio.tracks){const amount=p.volumes[t.kind as keyof Preset['volumes']];if(typeof amount==='number'){t.enabled=true;audio.setVolume(t.id,amount);}}
  ($<HTMLInputElement>('bpm')).value=String(p.bpm);
  $('bpm-value').textContent=`${p.bpm} BPM`;
  $('scene-title').textContent=p.label;
  $('transport-title').textContent=p.label;
  $('transport-description').textContent=p.description.slice(0,58);
  document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach(b=>b.classList.toggle('selected',b.dataset.theme===p.theme));
  renderTracks();stage.setTracks(audio.tracks);
}
setPreset(currentPreset);

function setPlayUI(){
  $('play-icon').textContent=audio.playing?'Ⅱ':'▶';
  ($<HTMLButtonElement>('play-btn')).setAttribute('aria-label',audio.playing?'暫停':'播放');
  document.querySelector('.sound-waves')?.classList.toggle('active',audio.playing);
}
async function playToggle(){
  try{
    if(audio.playing){audio.stop();status('已暫停播放');}
    else {await audio.play();status('正在播放音景，點選彩色光球可切換音軌');}
    setPlayUI();
  }catch(err){status(`無法播放：${String(err)}`,true);}
}
$('play-btn').addEventListener('click',()=>void playToggle());
$('generate').addEventListener('click',async()=>{
  if(busy)return;
  const description=($<HTMLTextAreaElement>('prompt')).value;
  const preset=parsePrompt(description);
  setPreset(preset);
  status(`已產生「${preset.label}」音景，現在可以自由混音`);
  if(!audio.playing){try{await audio.play();setPlayUI();}catch(e){status(String(e),true);}}
});
$('reset-view').addEventListener('click',()=>{setPreset(structuredClone(presets.space));status('已恢復星際漫遊預設');});
document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach(btn=>btn.addEventListener('click',()=>{
  const theme=btn.dataset.theme as Theme;
  setPreset(structuredClone(presets[theme]));
  ($<HTMLTextAreaElement>('prompt')).value=presets[theme].description;
  status(`已切換到「${presets[theme].label}」`);
}));
document.querySelectorAll<HTMLButtonElement>('[data-fill]').forEach(btn=>btn.addEventListener('click',()=>{$<HTMLTextAreaElement>('prompt').value=btn.dataset.fill||'';}));
$('track-list').addEventListener('input',e=>{
  const input=(e.target as HTMLElement).closest<HTMLInputElement>('[data-volume]');
  if(!input)return;
  const id=input.dataset.volume!;audio.setVolume(id,Number(input.value));
  const output=input.parentElement?.querySelector('output');if(output)output.textContent=`${input.value}%`;
});
$('track-list').addEventListener('click',e=>{
  const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
  if(button.dataset.toggle)audio.toggle(button.dataset.toggle);
  if(button.dataset.remove)audio.remove(button.dataset.remove);
  renderTracks();stage.setTracks(audio.tracks);
});
$('bpm').addEventListener('input',e=>{
  const n=Number((e.target as HTMLInputElement).value);audio.setBpm(n);$('bpm-value').textContent=`${n} BPM`;
});
$('master').addEventListener('input',e=>{
  const n=Number((e.target as HTMLInputElement).value);audio.setMaster(n);$('master-value').textContent=`${n}%`;
});
$('audio-input').addEventListener('change',async e=>{
  const input=e.target as HTMLInputElement;
  const files=Array.from(input.files||[]).slice(0,5);
  for(const file of files){try{const t=await audio.addFile(file);status(`成功加入音軌：${t.name}`);}catch(err){status(`音訊上傳失敗：${String(err)}`,true);}}
  renderTracks();stage.setTracks(audio.tracks);input.value='';
});
$('bg-input').addEventListener('change',async e=>{
  const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;
  if(file.size>80*1024*1024){status('背景檔案請小於 80 MB',true);return;}
  try{await stage.setBackground(file);$('bg-name').textContent=file.name.slice(0,25);status(`背景已更新：${file.name}`);}catch(err){status(`背景上傳失敗：${String(err)}`,true);}
});
$('bg-clear').addEventListener('click',()=>{stage.clearBackground();$('bg-name').textContent='尚未上傳背景';($<HTMLInputElement>('bg-input')).value='';status('已移除自訂背景');});

function exportSeconds(){return Number(($<HTMLSelectElement>('duration')).value);}
$('export-mp3').addEventListener('click',async()=>{
  if(busy)return;
  setBusy(true);
  try{
    status('正在離線渲染混音…');
    const buffer=await audio.renderOffline(exportSeconds());
    const mp3=await encodeMp3(buffer,msg=>status(msg));
    downloadBlob(mp3,`soundscape-${currentPreset.theme}-${exportSeconds()}s.mp3`);
    status('MP3 匯出成功！');
  }catch(err){status(`MP3 匯出失敗：${err instanceof Error?err.message:String(err)}`,true);}
  finally{setBusy(false);}
});
$('export-mp4').addEventListener('click',async()=>{
  if(busy)return;
  setBusy(true);
  let captured:{blob:Blob,format:'mp4'|'webm'}|null=null;
  try{
    audio.stop();await audio.play();setPlayUI();stage.rewindVideo();
    captured=await captureMovie(stage.canvas,audio.mediaStream,exportSeconds(),msg=>status(msg));
    if(captured.format==='mp4'){
      downloadBlob(captured.blob,`soundscape-${currentPreset.theme}-${exportSeconds()}s.mp4`);
      status('MP4 已匯出完成！');
    }else{
      const mp4=await webmToMp4(captured.blob,msg=>status(msg));
      downloadBlob(mp4,`soundscape-${currentPreset.theme}-${exportSeconds()}s.mp4`);
      status('MP4 轉檔完成，作品已下載！');
    }
  }catch(err){
    if(captured?.format==='webm'){
      downloadBlob(captured.blob,`soundscape-backup-${exportSeconds()}s.webm`);
      status(`MP4 轉檔失敗，已提供 WebM 備份：${err instanceof Error?err.message:String(err)}`,true);
    }else status(`MP4 錄製失敗：${err instanceof Error?err.message:String(err)}`,true);
  }finally{setBusy(false);}
});
window.setInterval(()=>{
  const now=performance.now();
  if(audio.playing)elapsed+=(now-lastTick)/1000;
  lastTick=now;
  const minutes=Math.floor(elapsed/60).toString().padStart(2,'0'),seconds=Math.floor(elapsed%60).toString().padStart(2,'0');
  $('clock').textContent=`${minutes}:${seconds}`;
  const freq=audio.spectrum;
  const average=Math.round(Array.from(freq).slice(0,55).reduce((a,b)=>a+b,0)/55/255*100);
  $('monitor-value').textContent=`${average}%`;
  $('monitor-bar').style.width=`${average}%`;
},200);
