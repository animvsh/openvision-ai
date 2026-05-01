import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const AWS_API_URL = process.env.VITE_API_URL || 'https://api.openvision.ai'
const WS_URL = process.env.VITE_WS_URL || 'wss://ws.openvision.ai'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(AWS_API_URL),
    'import.meta.env.VITE_WS_URL': JSON.stringify(WS_URL),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          cv: ['@tensorflow/tfjs', '@tensorflow-models/coco-ssd'],
          mediapipe: ['@mediapipe/face_mesh', '@mediapipe/camera_utils'],
        },
      },
    },
  },
})
