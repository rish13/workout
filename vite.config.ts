import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase warning threshold
    sourcemap: false, // Disable source maps in production to reduce size
    minify: 'terser', // Use terser for better minification
    rollupOptions: {
      output: {
        // Split code into smaller chunks
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
              return 'vendor-react';
            }
            if (id.includes('aws-amplify')) {
              return 'vendor-amplify';
            }
            if (id.includes('lucide')) {
              return 'vendor-icons';
            }
            return 'vendor'; // all other packages
          }
        }
      }
    }
  }
})