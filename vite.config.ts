import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lấy PORT từ biến môi trường để hỗ trợ deploy trên Railway
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000, // Railway sẽ đặt PORT tự động
    host: "0.0.0.0", // Cần thiết để Railway có thể truy cập
  },
  build: {
    outDir: "dist",
  },
});
