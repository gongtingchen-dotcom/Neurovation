import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' lets the built site run from any sub-path (GitHub Pages, a USB stick, an intranet share).
export default defineConfig({
  plugins: [react()],
  base: './',
});
