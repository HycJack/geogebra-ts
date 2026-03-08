import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'ts-geogebra-core': path.resolve(__dirname, '../ts-geogebra-core/src'),
    },
  },
});
