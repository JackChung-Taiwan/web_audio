# 彩虹節奏宇宙 V2 — Three.js + Web Audio

直接部署於 GitHub Pages：[開啟網站](https://jackchung-taiwan.github.io/web_audio/)

## 功能
- 3D 音樂律動球、動態霓虹光環、彩色粒子、背景燈光與 UnrealBloomPass 發光
- 六種粒子特效：銀河旋渦、流星星空、繽紛泡泡、愛心派對、音樂噴泉、節奏煙火
- 四種色彩主題、粒子數量／律動強度／音量控制、頻譜圖、PNG 截圖與全螢幕
- 上傳 MP3 / WAV 等本機音訊，或播放內建原創電子節奏；可使用麥克風
- 貼入 YouTube 連結，於嵌入播放器播放影片；支援 Chrome / Edge 分享分頁音訊以驅動真正的音頻分析

## YouTube 聲音分析注意事項
YouTube iframe 跨來源音訊**無法直接**連結到本頁的 Web Audio AnalyserNode。**貼上 YouTube 連結只會載入播放器，不代表聲音分析已啟用。**

操作方式：
1. 貼上合法 YouTube 網址，按「載入 YouTube」並播放影片。
2. 按「分享分頁音訊」，選擇播放影片的 Chrome/Edge 分頁，並勾選「分享分頁音訊」。
3. 授權後才會根據實際的低音、中音和高音變動；不支援該選項時請改用上傳音樂或麥克風。

YouTube 影片是否允許嵌入由版權者與 YouTube 控制；部分影片可能拒絕嵌入或自動播放。

## 開發與部署
```bash
npm install
npm run dev
npm run build
```

本專案採 **Vite + Three.js r187**，預設 GitHub Actions 工作流程在 `main` 更新時執行 `npm install`、`npm run build` 並部署 `dist`。Vite 的 `base` 已設為 `/web_audio/`。

- `index.html`：正式版（Vite 將 Three.js 打包，避免 CDN 外部載入造成空白畫面）
- `public/standalone.html`：可另外下載、以 CDN import map 啟動的獨立 HTML 版本（需網路連線）
- `.github/workflows/deploy.yml`：原本自動部署流程

## 資源授權
Three.js 為 MIT License。YouTube 影片與音樂的權利歸各自權利人所有。
