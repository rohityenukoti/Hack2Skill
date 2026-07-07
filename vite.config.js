import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  base: command === 'build' && mode === 'ghpages' ? '/Hack2Skill/' : '/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
}));
