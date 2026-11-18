# SoundScape Lab｜Web Audio × Three.js

適合國小高年級至國中的互動音景創作教學網頁。

## 線上網站
https://jackchung-taiwan.github.io/web_audio/

## 功能
- 中文提示詞（本地關鍵字解析，不使用 AI API）。
- Three.js 即時 3D 場景、可拖曳視角、點擊 3D 音球靜音。
- Web Audio API 六軌混音：旋律、低音、雨、風、鈴聲和自訂音訊。
- 上傳圖片或影片當背景，音訊視覺化跟隨節奏。
- 錄製 10／20／30 秒，匯出 MP3 和 MP4；MP4 轉檔失敗時備援 WebM。
- 手機／平板／電腦皆可開啟，建議最新版 Chrome 或 Edge。

## 部署
此版為無建置步驟的靜態網站。主要程式在 `index.html` 中，由瀏覽器載入 Three.js 與編碼工具 CDN。

啟用 **Settings → Pages → Build and deployment → Source: GitHub Actions**，`.github/workflows/deploy.yml` 會在每次推送 main 後部署。

## 注意
第一次啟動音訊必須由使用者點擊播放（瀏覽器安全限制）。MP3／MP4 編碼工具使用外部 CDN；第一次匯出需要網路和處理時間。某些瀏覽器不支援 MP4 原生錄製時，會改由 FFmpeg.wasm 轉檔，失敗時保留 WebM 備份。

請使用具有合法授權的圖片、背景影片和音樂。