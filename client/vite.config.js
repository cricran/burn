
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BURN',
        short_name: 'BURN',
        start_url: '/my',
        display: 'standalone',
        background_color: '#262c31',
        theme_color: '#008cff00',
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
});
