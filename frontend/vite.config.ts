import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/predict': 'http://localhost:8000',
      '/schema': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/insights': 'http://localhost:8000',
    },
  },
})
