import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The frontend only ever calls our own backend; this proxy just avoids
      // needing CORS/absolute URLs in dev. The backend owns every call that
      // needs a secret (LTA, OneMap, etc.).
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
