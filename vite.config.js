import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'ASTE',
        short_name: 'ASTE',
        description: 'ASTE system',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#f5f6fa',
        background_color: '#f5f6fa',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
    extensions: ['.js', '.jsx', '.scss'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        //loadPaths: [path.resolve(__dirname, 'src/styles')],
        additionalData: `@use '/src/styles/variables' as *;`,
        silenceDeprecations: ['legacy-js-api', 'global-builtin', 'color-functions'],
      },
    },
  },
})