import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueDevTools from 'vite-plugin-vue-devtools';
import svgLoader from 'vite-svg-loader';
import fs from 'node:fs';

import { viteStaticCopy } from 'vite-plugin-static-copy';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'public/cesium';

// process.env.VITE_APP_VERSION = process.env.npm_package_version;

// https://vite.dev/config/

// The function argument automatically provides 'mode'
export default defineConfig(({ mode }) => {
	// Load env file based on 'mode' in the current working directory.
	// Second argument is the directory where env files are located.
	const env = loadEnv(mode, process.cwd(), '');
	const packageJson = JSON.parse(
		fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
	);

	return {
		base: env.VITE_VIEWER_ENDPOINT,
		plugins: [
			vue(),
			vueJsx(),
			vueDevTools(),
			svgLoader(),
			viteStaticCopy({
				targets: [
					{ src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
					{ src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
					{ src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
					{ src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
				],
			}),
		],
		server: {
			proxy: {
				// Needed for Cesium offline maps - bypass CORS
				'/maps': {
					target: env.VITE_FILE_SERVER_URL,
					changeOrigin: true,
				},
			},
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				// 'osh-js': fileURLToPath(new URL('./lib/osh-js', import.meta.url)),
				// osh-js is resolved from node_modules
			},
		},
		build: {
			rollupOptions: {
				external: ['fsevents', 'node:path'],
			},
		},
		ssr: {
			noExternal: ['osh-js', 'cesium', 'leaflet'],
		},
		optimizeDeps: {
			include: [
				'cesium',
				'leaflet',
				'@cesium/engine',
				'@cesium/widgets',
				'mersenne-twister',
				'chart.js',
			],
			exclude: ['osh-js'],
		},
		worker: {
			format: 'es',
			rollupOptions: {},
		},
		define: {
			CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
			APP_VERSION: JSON.stringify(packageJson.version),
		},
	};
});
