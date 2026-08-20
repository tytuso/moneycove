import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Keep this project self-contained. Vite otherwise searches parent folders
  // for PostCSS config files, which can accidentally load a config belonging
  // to another project (for example D:\\postcss.config.mjs on Windows).
  // Tailwind CSS is handled by the official @tailwindcss/vite plugin below,
  // so no PostCSS plugins are required here.
  css: {
    postcss: {
      plugins: [],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/moneycove-192.png', 'icons/moneycove-512.png'],
      manifest: false,
    }),
  ],
})
