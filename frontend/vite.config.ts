/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react-is'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/')) {
            if (normalized.includes('node_modules/three') || normalized.includes('node_modules/@react-three')) {
              return 'three';
            }
            if (normalized.includes('node_modules/recharts') || normalized.includes('node_modules/d3-')) {
              return 'charts';
            }
            if (normalized.includes('node_modules/firebase') || normalized.includes('node_modules/@firebase')) {
              return 'firebase';
            }
            if (normalized.includes('node_modules/framer-motion')) {
              return 'motion';
            }
            if (
              normalized.includes('node_modules/react/') ||
              normalized.includes('node_modules/react-dom/') ||
              normalized.includes('node_modules/react-router/') ||
              normalized.includes('node_modules/react-router-dom/') ||
              normalized.includes('node_modules/react-is/') ||
              normalized.includes('node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
