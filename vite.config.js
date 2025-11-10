import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "public/cesium";

// https://vite.dev/config/
export default defineConfig({
  base: JSON.stringify(process.env.VITE_VIEWER_ENDPOINT),
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'osh-js': fileURLToPath(new URL('./lib/osh-js', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      external: ['fsevents', 'node:path'],
    }
  },
  ssr: {
    noExternal: ['osh-js', 'cesium', 'leaflet']
  },
  optimizeDeps: {
    include: [ 'cesium', 'leaflet', 'osh-js'],
    exclude: []
  },
  worker: {
    format: 'es',
    rollupOptions: {

    }
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
  }
})
