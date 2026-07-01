import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'favicon.svg', 'icons.svg'],
      manifest: {
        name: 'JEE Tracker',
        short_name: 'JEE Tracker',
        description: 'Track your JEE prep — tasks, syllabus, mocks, and rank.',
        theme_color: '#0b1120',
        background_color: '#0b1120',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Allow the SW to show notifications even when the app is backgrounded
        runtimeCaching: [],
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: true, // test notifications in dev too
      },
    }),
  ],
  server: { port: 5173 },
});
