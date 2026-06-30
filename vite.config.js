import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'JEE Tracker Pro',
        short_name: 'JEE Tracker',
        description: 'Advanced Study Tracker for JEE Aspirants',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/vite.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      }
    })
  ],
})