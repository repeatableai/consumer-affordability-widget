import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Production build: single embeddable JS file with CSS inlined
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.tsx',
      name: 'AffordabilityWidget',
      fileName: 'affordability-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        // Inline CSS into JS for single-file embed
        assetFileNames: 'affordability-widget.[ext]',
      },
    },
  },
})
