import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/moodle': {
        target: 'https://universitice.univ-rouen.fr',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/moodle/, ''),
        cookieDomainRewrite: 'localhost',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
          'Access-Control-Allow-Credentials': 'true'
        }
      },
      '/login': {
        target: 'https://cas.univ-rouen.fr',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/login/, '/login')
      }
    }
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
