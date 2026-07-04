import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages only allows / or /docs as publish folders (not /dist)
  base: command === 'build' ? '/Hack2Skill/' : '/',
  build: {
    outDir: 'docs'
  },
  server: {
    port: 3000
  }
}))
