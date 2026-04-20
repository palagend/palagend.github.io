import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/coincap': {
        target: 'https://rest.coincap.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coincap/, '')
      }
    }
  }
})
