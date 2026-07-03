import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project site: https://<user>.github.io/Hack2Skill/
  base: command === 'build' ? '/Hack2Skill/' : '/',
  server: {
    port: 3000
  }
}))
