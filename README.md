# SoundScape Lab · Web Audio × 3D 互動音景教室

一個不需伺服器、沒有 AI API 費用的互動式 Web Audio 學生創作網頁。使用 **Three.js + TypeScript + Web Audio API + Vite**。

## 操作

1. 在「提示詞創作」輸入「海底世界，緩慢旋律，風聲，鈴聲，速度 72 BPM」並點「生成我的音景」。
2. 播放音景，點擊 3D 彩色光球開關音軌；用右側音量控制混合聲音。
3. 可上傳本機 MP3/WAV/M4A 音效，及背景 JPG/PNG/WEBP/MP4/WEBM。
4. 選擇 10/20/30 秒，下載 **MP3** 音訊或 **MP4** 動畫＋音訊。

> 「文字轉場景」為**本機規則引擎**（非連線大型語言模型），可以解析場景（太空／海洋／森林／城市）、情緒、BPM、雨風鈴聲／低音／旋律等字詞。後續可改接 LLM，但**不要把 API 密鑰寫進 GitHub Pages 前端**。

## Windows 本機啟動

先安裝 Node.js 22 以上。Windows 可以直接點兩下 `START_WINDOWS.bat`（首次執行需要網路下載套件）。或在專案資料夾開 PowerShell：

```powershell
npm install
npm run dev
```

再開瀏覽器到 `http://localhost:5173/`。建置與預覽：

```powershell
npm run build
npm run preview
```

## GitHub Pages 部署

1. 在 GitHub 建立公開儲存庫，例如 `web-audio-3d-lab`。
2. 將整個專案上傳（含隱藏 `.github/workflows/deploy.yml`，**不要**上傳 `node_modules`、`dist`）。使用 Git 命令較方便：

```bash
git init
git add .
git commit -m "Initial SoundScape Lab"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/web-audio-3d-lab.git
git push -u origin main
```

3. GitHub 儲存庫 → **Settings → Pages → Build and deployment → Source: GitHub Actions**。
4. 等待 Actions 的 `Deploy SoundScape Lab to GitHub Pages` 完成，開啟 `https://YOUR_USERNAME.github.io/web-audio-3d-lab/`。

`vite.config.ts` 使用相對路徑 `base: './'`，部署到各種 GitHub 專案子路徑時不需修改儲存庫名稱。

## MP3 與 MP4 匯出方式

- **MP3**：OfflineAudioContext 將合成器／環境聲／已上傳音訊做離線混音，再由 `@breezystack/lamejs` 編碼 160 kbps 立體聲 MP3。與是否正在播放無關。
- **MP4**：使用 WebGL Canvas.captureStream(30 FPS)＋Web Audio MediaStreamDestination 串接錄製 3D 畫面與混音。必須**即時錄滿所選秒數**。
- 瀏覽器若支援 `MediaRecorder` 的 MP4 MIME，直接下載 MP4；否則錄成 WebM，再由 `ffmpeg.wasm` **單執行緒版**轉碼 H.264/AAC MP4，首次使用額外下載約 31 MB WASM 模組。
- 如果轉碼失敗，為避免作品遺失，會**明確下載 `.webm` 備份**，不是將 WebM 偽裝成 `.mp4`。
- 背景影片須使用瀏覽器能解碼的格式；音訊上傳由 Web Audio 的 `decodeAudioData` 解碼。非所有 M4A/MP4 編碼在每個瀏覽器都受支援。
- 建議使用 Windows 版 Chrome/Edge 進行課堂示範；手機裝置的效能及支援程度會較不一致。
- 輸出限制為 10、20、30 秒，降低 GitHub Pages 純瀏覽器轉檔的記憶體壓力，非大型影音剪輯器。
- 自訂**背景影片的聲音不會自動加入混音**（影片畫面靜音使用）；如需它的聲音，請額外匯入音軌。
- 沒有後端／雲端儲存。刷新頁面後未匯出的上傳檔及設定不會保留。請尊重素材版權。

## 學生課堂活動建議（45 分鐘）

| 時間 | 教學活動 | 學習內容 |
|---|---|---|
| 5 分鐘 | 音景觀察 | 音高、音量、節奏與視覺的關係 |
| 10 分鐘 | 提示詞實驗 | 場景、形容詞、BPM 及條件規則 |
| 15 分鐘 | 3D 混音 | 音軌增減、混音與音訊視覺化 |
| 10 分鐘 | 上傳背景與輸出 | 媒體格式、錄製與著作權 |
| 5 分鐘 | 成果分享 | 學生解釋自己的設計選擇 |

## 專案架構

```text
src/main.ts       UI 互動與事件
src/audio.ts      Web Audio 音源與混音器 / 離線渲染
src/scene.ts      Three.js 音效視覺化 / 背景素材 / 3D 點選
src/presets.ts    中文提示詞解析與預設值
src/export.ts     MP3 與 MP4 錄製和轉檔
src/style.css     響應式介面
.github/workflows/deploy.yml  自動部署 GitHub Pages
```

## 教師開發延伸

- 加入更多情境與中文關鍵字：修改 `src/presets.ts`。
- 增加可控合成器軌道：修改 `src/audio.ts` 的 INITIAL、scheduleBeat、renderOffline。
- 增加物件：修改 `src/scene.ts`，並以 Raycaster 辨識互動。
- 加入真正的 AI 提示詞解析：透過安全的後端代理與權限管理呼叫模型；前端不應公開 API key。

授課時建議學生從預設音景開始，理解每個音軌的影響，再加入提示詞與自訂素材。

## 第三方授權

使用者上傳的圖片、聲音及影片不隨專案上傳。依賴套件的原始碼與授權條款列於 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)，其中 MP3 編碼器 `@breezystack/lamejs` 使用 LGPL-3.0。
