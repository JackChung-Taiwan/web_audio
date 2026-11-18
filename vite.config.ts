import { defineConfig } from 'vite';

// Relative URLs make the built site work at /<repository-name>/ on GitHub Pages.
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
