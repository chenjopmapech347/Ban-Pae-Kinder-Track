import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// อ่าน version จาก package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const APP_VERSION = pkg.version

// Plugin: เขียน public/version.json ทุกครั้งที่ build เพื่อให้ server serve เวอร์ชั่นล่าสุด
const versionPlugin = {
  name: 'write-version-json',
  buildStart() {
    writeFileSync(
      resolve(__dirname, 'public/version.json'),
      JSON.stringify({ version: APP_VERSION }, null, 2),
    )
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionPlugin],
  // Polyfill Node built-ins that `docx` relies on (buffer, process)
  // Vite 8 / Rolldown requires absolute paths in resolve.alias
  define: {
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(APP_VERSION),
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
