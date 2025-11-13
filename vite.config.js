import { fileURLToPath, URL } from 'node:url'

import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "public/cesium";

// https://vite.dev/config/


// The function argument automatically provides 'mode'
export default defineConfig(({ mode }) => {
  // Load env file based on 'mode' in the current working directory.
  // Second argument is the directory where env files are located.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_VIEWER_ENDPOINT,
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
  }
})
