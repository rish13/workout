import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined // Disable code splitting that might cause issues
      }
    }
  }
})