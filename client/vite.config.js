
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Ensure the service worker is injected and auto-updates
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Take control immediately and clean old caches
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Burn',
        short_name: 'Burn',
        start_url: '/my',
        display: 'standalone',
        background_color: '#262c31',
        theme_color: '#262c31',
        description: "Ton client web de l'URN moderne",
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '375x667',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
        shortcuts: [
          {
            name: 'Accueil',
            short_name: 'Accueil',
            description: "Aller à l'accueil",
            url: '/my',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Calendrier',
            short_name: 'Calendrier',
            description: 'Voir le calendrier',
            url: '/edt',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      // Proxy API routes to backend in dev, preserving cookies
      '/user': { target: 'http://localhost:3000', changeOrigin: true },
      '/calendar': { target: 'http://localhost:3000', changeOrigin: true },
      '/note': { target: 'http://localhost:3000', changeOrigin: true },
      '/color-settings': { target: 'http://localhost:3000', changeOrigin: true },
      '/hidden-events': { target: 'http://localhost:3000', changeOrigin: true },
      '/hidden-courses': { target: 'http://localhost:3000', changeOrigin: true },
      '/assignments': { target: 'http://localhost:3000', changeOrigin: true },
      '/mail': { target: 'http://localhost:3000', changeOrigin: true },
      '/mail-settings': { target: 'http://localhost:3000', changeOrigin: true },
    }
  }
});
