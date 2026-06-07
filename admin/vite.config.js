import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base '/admin/' agar cocok saat di-serve backend di path /admin
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
});
