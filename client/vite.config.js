import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss()
  ],
server: {
    proxy: {
      '/v2': {
        target: 'http://localhost:3080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});