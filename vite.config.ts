import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Puerto 3000: el servidor de IA ya acepta conexiones desde http://localhost:3000
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
})
