# Third-party notices

The SoundScape Lab application uses open-source packages installed via `npm install`.

- **Three.js** — MIT, https://github.com/mrdoob/three.js
- **Vite** — MIT, https://github.com/vitejs/vite
- **@ffmpeg/ffmpeg / @ffmpeg/core** — package-specific upstream licenses and notices: https://github.com/ffmpegwasm/ffmpeg.wasm
- **@breezystack/lamejs 1.2.7** — LGPL-3.0. Original and modified-source repositories: https://github.com/shijinyu/lamejs and https://github.com/zhuker/lamejs . GNU LGPL-3.0 license: https://www.gnu.org/licenses/lgpl-3.0.html . This package is loaded as a separate on-demand JavaScript chunk through Vite `import()`; it is not modified by this project. To replace or modify the encoder in your own deployment, rebuild with a modified compatible `@breezystack/lamejs` module.

Review relevant licenses before redistributing modified dependency builds, and follow the distribution and source-offer terms when relevant.
