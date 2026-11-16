import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Tách các thư viện nặng ra khỏi bundle chính để trình duyệt cache
    // riêng từng chunk (kết hợp với Cache-Control: immutable ở worker.js,
    // lần mở sau chỉ tải lại chunk nào đổi hash). Không đổi logic lazy:
    // Rollup chỉ tách file đầu ra, thứ tự tải vẫn như cũ.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdfjs';
          if (id.includes('node_modules/recharts')) return 'vendor-recharts';
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler')
          )
            return 'vendor-react';
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
