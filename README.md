# 彩虹節奏宇宙 V4 — Three.js + Web Audio

[開啟正式網站](https://jackchung-taiwan.github.io/web_audio/) · [專案原始碼](https://github.com/JackChung-Taiwan/web_audio)

V4 保留 V3 的 Web Audio 分析、YouTube 分頁分享、檔案上傳、麥克風、內建示範電子音、音量控制、32 頻段小頻譜、截圖、全螢幕與純視覺模式，新增六種可切換的 3D 音訊視覺化效果。

## 十二種視覺效果

### V4 新增六種效果
| 模式 | 核心 Three.js 物件 | 音訊反應 |
|---|---|---|
| 雷射隧道 | LineLoop + Line | 低音使光環擴張並加速移動 |
| 極光絲帶 | 多條動態 Line | 中音改變光帶起伏，高音改變細紋 |
| 霓虹波形（預設） | 動態 Line | 頻譜與中高音調整長線條曲線 |
| 粒子星河 | Points + BufferGeometry | 低音擴散、高音改變粒子高度 |
| 光纖絲線 | 單一 LineSegments | 中高音使大量細線搖擺 |
| 環形頻譜 | 單一 LineSegments | 依照音訊頻帶伸縮的環狀射線 |

### 原有六種效果
銀河旋渦、流星星空、繽紛泡泡、愛心派對、音樂噴泉、節奏煙火。可使用「經典粒子特效」按鈕切換回原效果。

## 控制項
- 亮度：20%–130%，預設 70%，不會將整個畫面設為過亮
- 色相偏移：-180°–180°；沿用原先糖果／霓虹／海洋／極光四主題
- 粒子數量：500–5000，套用在原有粒子模式與新星河／光纖模式
- 律動強度、律動線條長度、示範／本機音訊音量、Bloom 切換
- 右下方「純視覺模式」可隱藏所有介面，按 H、Esc 或還原按鈕復原
- 滑鼠拖曳旋轉視角，滾輪縮放；手機可使用觸控操作
- PNG 截圖、瀏覽器全螢幕

## YouTube 的實際音訊限制

YouTube 的跨來源 iframe 不能直接當成 Web Audio 的音訊來源。**只貼上影片連結，不會自動取得聲音頻譜。**

在桌面 Chrome／Edge：
1. 貼上 YouTube 影片連結，按「載入 YouTube」並開始播放。
2. 按「分享分頁音訊」，選擇播放該影片的分頁。
3. 確認勾選「分享分頁音訊」並授權。
4. 允許分享後，視覺效果才根據真正的 YouTube 聲音變動。

瀏覽器或作業系統不支援分頁音訊分享時，請改用上傳 MP3 / WAV / M4A 或麥克風。部分影片受權利人限制不可嵌入。

## 手機效能最佳化
- 手機限制 devicePixelRatio 上限為 1.2、預設關閉 Bloom，並以約 30 FPS 為目標
- 手機新星河模式最多使用 1,600 個粒子，光纖細線最多使用 140 條
- 大多數新特效使用單一 BufferGeometry 或少量線條，不為每顆粒子配置一個 Mesh
- 切換特效時釋放前一模式的 geometry 與 material
- 分頁隱藏時不進行不必要的畫面渲染
- 桌機維持較高解析度與更多粒子，實際影格率仍取決於裝置 GPU

## 本機開發

Node.js 22：

```bash
npm install
npm run dev
npm run build
npm run preview
```

專案使用 Three.js 0.187.0 + Vite，`vite.config.ts` 中 `base='/web_audio/'`，適用 GitHub Pages 專案子路徑。推送 `main` 後，`.github/workflows/deploy.yml` 會執行 build 並部署 `dist`。

### 程式結構
- `index.html`：V4 主網站、既有音訊分析與音訊來源、畫面控制面板
- `src/visual-fx.js`：六種新音樂特效的獨立 Three.js 模組、資源生命週期
- `package.json`、`vite.config.ts`：建置配置
- `public/standalone.html`：保留原有 V3 獨立版（未包含 V4 新特效；正式版請使用網站根目錄）
- `.github/workflows/deploy.yml`：GitHub Pages 自動部署

## 音樂與原始碼授權
Three.js 為 MIT License。上傳的音訊在本機瀏覽器中分析。YouTube 影片權利歸其權利人所有；本專案不提供擷取、下載或繞過版權限制的功能。
