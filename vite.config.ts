import { defineConfig } from 'vite';

// GitHub Pages project site lives at /web_audio/ (not the domain root).
// Using an explicit base ensures bundled JS, CSS and dynamic assets load
// correctly even when the browser opens the site with query parameters.
export default defineConfig({
  base: '/web_audio/',
  build: { target: 'es2022' },
});
