import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Polyfill Node built-ins that `docx` relies on (buffer, process)
  // Vite 8 / Rolldown requires absolute paths in resolve.alias
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: resolve(__dirname, 'node_modules/buffer/index.js'),
    },
  },
  optimizeDeps: {
    include: ['buffer', 'docx'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase — แยกเป็น chunk ตัวเอง
          if (id.includes('node_modules/firebase')) return 'firebase-vendor';
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
          // Recharts + dependencies
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) return 'chart-vendor';
          // Excel
          if (id.includes('node_modules/xlsx')) return 'xlsx-vendor';
          // Supabase
          if (id.includes('node_modules/@supabase')) return 'supabase-vendor';
          // Word export
          if (id.includes('node_modules/docx')) return 'docx-vendor';
        },
      },
    },
  },
})
