<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { onMounted, onBeforeUnmount, ref, computed, watch, toRaw } from 'vue';
import * as Cesium from 'cesium';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import VideoView from 'osh-js/source/core/ui/view/video/VideoView.js';
import VideoDataLayer from 'osh-js/source/core/ui/layer/VideoDataLayer.js';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import {
	createDatasource,
} from '@/modules/visualization/services/datasource.service';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { getGroundAltitude } from '@/modules/map/services/altitude.service';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { createPointMarkerLayer } from '@/modules/map/mapVisualizations';

const props = defineProps({
	visualization: {
		type: OSHVisualization,
		required: false,
		default: null,
	},
	datasource: {
		type: Array as () => IConSysApiDataSourceProperties[],
		required: true,
		default: () => [],
	},
});

interface LLAData {
	lat: number;
	lon: number;
	alt: number;
}

interface OrientationData {
	yaw: number;
	pitch: number;
	roll: number;
}

const receivedLLA = ref<LLAData>({ lat: 0, lon: 0, alt: 0 });
const receivedOrientation = ref<OrientationData>({ yaw: 0, pitch: 0, roll: 0 });

let dsInstances = ref<typeof ConSysApi[]>([]);

let mapView: typeof CesiumView | null = null;
const minimapContainerId = `minimap-${Date.now()}`;

const viewMode = ref<'platform' | 'follow' | 'overhead' | 'freelook'>('follow');
const showHUD = ref(false);
const showAROverlay = ref(false);
const viewModeBeforeAR = ref<'platform' | 'follow' | 'overhead' | 'freelook'>('follow');
const arFov = ref(85);

const hasOrientation = ref(false);
const hasVideo = ref(false);

const visualizationStore = useVisualizationStore();
const duplicatedLayerIds = new Set<string>();
const duplicatedDsInstances: (typeof ConSysApi)[] = [];

let terrainHeight = 0;
let lastSampledLat = 0;
let lastSampledLon = 0;

async function updateTerrainHeight(lon: number, lat: number) {
	const dLat = lat - lastSampledLat;
	const dLon = lon - lastSampledLon;
	if (Math.abs(dLat) < 0.0005 && Math.abs(dLon) < 0.0005) return;

	lastSampledLat = lat;
	lastSampledLon = lon;

	const height = await getGroundAltitude(lon, lat);
	if (height !== null) terrainHeight = height;
}

function onLLAListener(dsInstance: typeof ConSysApi, ds: IConSysApiDataSourceProperties) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			const lon = data[ds.properties.location.property].lon ?? 0;
			const lat = data[ds.properties.location.property].lat ?? 0;
			const alt = data[ds.properties.location.property].alt ?? 0;
			receivedLLA.value = {
				lat,
				lon,
				alt: alt,
			};
			updateTerrainHeight(lon, lat);
		}
	};
}

function onOrientationListener(dsInstance: typeof ConSysApi, ds: IConSysApiDataSourceProperties) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			receivedOrientation.value = {
				yaw: data[ds.properties.orientation.property].yaw ?? data[ds.properties.orientation.property].heading ?? 0,
				pitch: data[ds.properties.orientation.property].pitch ?? 0,
				roll: data[ds.properties.orientation.property].roll ?? 0,
			};

			hasOrientation.value = true;
		}
	};
}

const videoContainerId = `minimap-video-${Date.now()}`;
let arVideoView: any = null;
let arVideoLayer: any = null;
let videoDsInstance: typeof ConSysApi | null = null;
let videoDsProps: IConSysApiDataSourceProperties | null = null;

function createVideoView() {
	if (arVideoView || !videoDsProps) return;

	const rawDs = toRaw(videoDsProps);

	videoDsInstance = createDatasource(rawDs);

	const getFrameData = {
		dataSourceIds: [videoDsInstance.id],
		handler: (rec: any) => {
			return rec[rawDs.properties.video.property];
		}
	};

	const getTimestamp = {
		dataSourceIds: [videoDsInstance.id],
		handler: (rec: any) => rec.timestamp,
	};

	arVideoView = new VideoView({
		container: videoContainerId,
		css: 'video-view',
		layers: [],
		useWebCodecApi: true,
		showTime: false,
		showStats: false,
	});

	arVideoLayer = new VideoDataLayer({
		name: 'ar-video',
		dataSourceIds: [videoDsInstance.id],
		...(getFrameData ? { getFrameData } : {}),
		...(getTimestamp ? { getTimestamp } : {})
	});

	arVideoView.addLayer(arVideoLayer);
	videoDsInstance.connect();
}

function destroyVideoView() {
	if (videoDsInstance) {
		videoDsInstance.disconnect();
		videoDsInstance = null;
	}
	if (arVideoView) {
		try { arVideoView.destroy(); } catch (e) {}
		arVideoView = null;
		arVideoLayer = null;
	}
}

// show only markers/layers that the 'camera' can currently see
function cullToFrustum() {
	if (!mapView?.viewer) return;
	const camera = mapView.viewer.camera;
	const frustum = camera.frustum;

	const cullingVolume = frustum.computeCullingVolume(
		camera.positionWC,
		camera.directionWC,
		camera.upWC
	);

	if (mapView.billboardCollection) {
		for (let i = 0; i < mapView.billboardCollection.length; i++) {
			const bb = mapView.billboardCollection.get(i);
			if (bb.position) {
				const visibility = cullingVolume.computeVisibility(
					new Cesium.BoundingSphere(bb.position, 50)
				);
				bb.show = visibility !== Cesium.Intersect.OUTSIDE;
			}
		}
	}
	if (mapView.labelCollection) {
		for (let i = 0; i < mapView.labelCollection.length; i++) {
			const lb = mapView.labelCollection.get(i);
			if (lb.position) {
				const visibility = cullingVolume.computeVisibility(
					new Cesium.BoundingSphere(lb.position, 50)
				);
				lb.show = visibility !== Cesium.Intersect.OUTSIDE;
			}
		}
	}
}

function restoreBillboardVisibility() {
	if (!mapView) return;
	if (mapView.billboardCollection) {
		for (let i = 0; i < mapView.billboardCollection.length; i++) {
			mapView.billboardCollection.get(i).show = true;
		}
	}
	if (mapView.labelCollection) {
		for (let i = 0; i < mapView.labelCollection.length; i++) {
			mapView.labelCollection.get(i).show = true;
		}
	}
}

function toggleAROverlay() {
	showAROverlay.value = !showAROverlay.value;

	if (!mapView?.viewer) return;
	const viewer = mapView.viewer;

	if (showAROverlay.value) {
		viewModeBeforeAR.value = viewMode.value;
		viewMode.value = 'platform';
		// render cesium on transparent background
		viewer.scene.globe.show = false;
		viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
		updateARFov();
		createVideoView();
	} else {
		viewMode.value = viewModeBeforeAR.value;

		viewer.scene.globe.show = true;
		viewer.scene.backgroundColor = Cesium.Color.BLACK;
		viewer.scene.moon.show = true;
		destroyVideoView();
		restoreBillboardVisibility();
	}

	viewer.scene.requestRender();
}

function updateARFov() {
	if (!mapView?.viewer || !showAROverlay.value) return;
	const frustum = mapView.viewer.camera.frustum;
	if (frustum instanceof Cesium.PerspectiveFrustum) {
		frustum.fov = Cesium.Math.toRadians(arFov.value);
		mapView.viewer.scene.requestRender();
	}
}

watch(arFov, () => updateARFov());

function setSceneInputEnabled(viewer: any, enabled: boolean) {
	const controller = viewer.scene.screenSpaceCameraController;
	controller.enableRotate = enabled;
	controller.enableTranslate = enabled;
	controller.enableZoom = enabled;
	controller.enableTilt = enabled;
	controller.enableLook = enabled;
}

function updateCamera() {
	if (!mapView?.viewer) return;
	if (viewMode.value === 'freelook') return;

	const lon = receivedLLA.value.lon;
	const lat = receivedLLA.value.lat;
	const alt = receivedLLA.value.alt;

	if (lon === 0 && lat === 0) return;

	const viewer = mapView.viewer;

	const cameraAlt = terrainHeight + alt;

	const position = Cesium.Cartesian3.fromDegrees(
		lon,
		lat,
		cameraAlt
	);

	const heading = Cesium.Math.toRadians(
		receivedOrientation.value.yaw
	);

	const pitch = Cesium.Math.toRadians(
		receivedOrientation.value.pitch || 0
	);

	const roll = Cesium.Math.toRadians(
		receivedOrientation.value.roll || 0
	);

	switch (viewMode.value) {
		case 'platform': {
			viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
			viewer.camera.setView({
				destination: Cesium.Cartesian3.fromDegrees(lon, lat, cameraAlt + 1.5),
				orientation: {
					heading,
					pitch,
					roll,
				},
			});
			break;
		}
		case 'follow': {
			const transform =
				Cesium.Transforms.headingPitchRollToFixedFrame(
					position,
					new Cesium.HeadingPitchRoll(heading, 0, 0)
				);

			viewer.camera.lookAtTransform(
				transform,
				new Cesium.Cartesian3(0, -120, 60)
			);
			break;
		}
		case 'overhead': {
			const transform =
				Cesium.Transforms.headingPitchRollToFixedFrame(
					position,
					new Cesium.HeadingPitchRoll(heading, 0, 0)
				);

			viewer.camera.lookAtTransform(
				transform,
				new Cesium.Cartesian3(0, 0, 250)
			);
			break;
		}
	}

	if (showAROverlay.value) {
		cullToFrustum();
	}

	viewer.scene.requestRender();
}

onMounted(async () => {
	mapView = new CesiumView({
		container: minimapContainerId,
		autoZoomOnFirstMarker: true,
		layers: [],
		options: {
			viewerProps: {
				orderIndependentTranslucency: false,
				skyBox: false,
				skyAtmosphere: false,
				contextOptions: {
					webgl: {
						alpha: true,
					},
				},
			},
		},
	});
	await new Promise(requestAnimationFrame);

	const viewer = mapView.viewer;
	viewer.scene.globe.depthTestAgainstTerrain = false;
	viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
		requestVertexNormals: true,
	});

	viewer.scene.requestRenderMode = true;
	viewer.scene.maximumRenderTimeChange = Infinity;

	viewer.scene.fog.enabled = false;
	viewer.scene.shadowMap.enabled = false;

	setSceneInputEnabled(mapView.viewer, false);

	for (const ds of props.datasource) {
		let dsInstance = createDatasource(ds);
		if (ds?.properties?.location) {
			onLLAListener(dsInstance, ds);
		}
		if (ds?.properties?.orientation) {
			onOrientationListener(dsInstance, ds);
		}

		if (ds?.properties?.video) {
			hasVideo.value = true;
			videoDsProps = ds;
			continue;
		}

		dsInstance.connect();
		dsInstances.value.push(dsInstance);
	}

	addPointMarkerLayers();
});

watch([receivedLLA, receivedOrientation], () => {
	updateCamera();
}, { deep: true });

watch(viewMode, (newMode) => {
	if (!mapView?.viewer) return;
	const viewer = mapView.viewer;

	viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

	if (newMode === 'freelook') {
		setSceneInputEnabled(viewer, true);
	} else {
		setSceneInputEnabled(viewer, false);
		updateCamera();
	}
});

async function addPointMarkerLayers() {
	if (!mapView) return;

	const pmVizs = visualizationStore.getVisualizationsByType('pointmarker');
	for (const viz of pmVizs) {
		if (duplicatedLayerIds.has(viz.id)) continue;
		if (Array.isArray(viz.visualizationComponents)) continue;

		const dsArray = viz.visualizationComponents.dataSource;
		if (!dsArray?.length) continue;

		const result = await createPointMarkerLayer(viz, dsArray);
		mapView.addLayer(result.vizLayer);
		duplicatedLayerIds.add(viz.id);

		for (const ds of result.dsInstances) {
			duplicatedDsInstances.push(ds);
		}
	}
}

watch(
	() => visualizationStore.mapVisualizations.length,
	() => {
		addPointMarkerLayers();
	}
);

onBeforeUnmount(() => {
	destroyVideoView();
	if (mapView) {
		mapView.destroy();
		mapView = null;
	}
	for (const ds of dsInstances.value) {
		ds.disconnect();
	}
	for (const ds of duplicatedDsInstances) {
		ds.disconnect();
	}
});
useVisualizationCleanup(dsInstances);
</script>

<template>
	<div class="minimap-wrapper">
		<div class="minimap-controls">
			<v-btn-toggle
				v-model="viewMode"
				mandatory
				:disabled="showAROverlay"
				class="ga-2"
			>
				<v-btn
					value="platform"
					:disabled="!hasOrientation"
					density="compact"
					size="small"
				>
					<v-icon start>mdi-airplane</v-icon>
					Platform
				</v-btn>

				<v-btn
					value="follow"
					density="compact"
					size="small"
				>
					<v-icon start>mdi-camera-control</v-icon>
					Follow
				</v-btn>

				<v-btn
					value="overhead"
					density="compact"
					size="small"
				>
					<v-icon start>mdi-crosshairs-gps</v-icon>
					Overhead
				</v-btn>
				<v-btn
					value="freelook"
					density="compact"
					size="small"
				>
					<v-icon start>mdi-orbit-variant</v-icon>
					Free-look
				</v-btn>
			</v-btn-toggle>
		</div>
		<div class="minimap-scene">
			<div
				:id="videoContainerId"
				class="video-background"
				:class="{ 'video-visible': showAROverlay && hasVideo }"
			></div>
			<div
				:id="minimapContainerId"
				class="minimap-viewer"
				:class="{ 'ar-transparent': showAROverlay }"
			></div>

			<div class="overlay-toggles">
				<v-btn
					class="overlay-toggle-btn"
					:color="showHUD ? 'green' : undefined"
					size="x-small"
					@click="showHUD = !showHUD"
				>
					HUD
				</v-btn>
				<v-btn
					v-if="hasVideo"
					class="overlay-toggle-btn"
					:color="showAROverlay ? 'green' : undefined"
					size="x-small"
					@click="toggleAROverlay"
				>
					<v-icon start size="small">mdi-augmented-reality</v-icon>
					AR
				</v-btn>
			</div>

			<div v-if="showAROverlay" class="ar-fov-control">
				<span class="ar-fov-label">FOV {{ arFov }}°</span>
				<v-slider
					v-model="arFov"
					:min="30"
					:max="120"
					:step="1"
					density="compact"
					hide-details
					thumb-size="12"
					track-size="2"
					color="green"
				/>
			</div>

			<div v-if="showHUD" class="hud-overlay" :style="{ transform: `rotate(${-receivedOrientation.roll}deg)` }">
				<div class="hud-crosshair">
					<div class="crosshair-h"></div>
					<div class="crosshair-v"></div>
				</div>

				<div class="hud-alt">
					<div class="hud-data-label">ALT</div>
					<div class="hud-data-value">{{ receivedLLA.alt.toFixed(1) }}<span class="hud-unit">m</span></div>
				</div>

				<div class="hud-attitude">
					<div class="hud-data-label">PITCH</div>
					<div class="hud-data-value">{{ receivedOrientation.pitch.toFixed(1) }}&#176;</div>
					<div class="hud-data-label">ROLL</div>
					<div class="hud-data-value">{{ receivedOrientation.roll.toFixed(1) }}&#176;</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.minimap-wrapper {
	position: relative;
	width: 100%;
}
.minimap-controls {
	display: flex;
	justify-content: center;
	padding: 4px 0;
	z-index: 1;
}

.minimap-scene {
	position: relative;
	width: 100%;
	height: 400px;
}
.minimap-viewer {
	width: 100%;
	height: 100%;
}
.minimap-viewer :deep(.cesium-viewer),
.minimap-viewer :deep(.cesium-widget),
.minimap-viewer :deep(.cesium-widget canvas) {
	width: 100% !important;
	height: 100% !important;
}

.overlay-toggles {
	position: absolute;
	top: 6px;
	left: 6px;
	z-index: 2;
	display: flex;
	gap: 4px;
}

.ar-fov-control {
	position: absolute;
	bottom: 8px;
	right: 8px;
	z-index: 2;
	display: flex;
	align-items: center;
	gap: 8px;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 4px;
	padding: 4px 12px;
	width: 200px;
}
.ar-fov-label {
	color: #00ff41;
	font-family: 'Courier New', monospace;
	font-size: 11px;
	white-space: nowrap;
}

.video-background {
	position: absolute;
	inset: 0;
	z-index: 0;
	background: #000;
	overflow: hidden;
	visibility: hidden;
	pointer-events: none;
}
.video-background.video-visible {
	visibility: visible;
}

.minimap-viewer.ar-transparent {
	position: absolute;
	inset: 0;
	z-index: 1;
}
.minimap-viewer.ar-transparent :deep(.cesium-viewer),
.minimap-viewer.ar-transparent :deep(.cesium-widget),
.minimap-viewer.ar-transparent :deep(.cesium-widget canvas) {
	background: transparent !important;
}

.hud-overlay {
	position: absolute;
	inset: 0;
	pointer-events: none;
	color: #00ff41;
	font-family: 'Courier New', monospace;
	font-size: 11px;
	text-shadow: 0 0 4px rgba(0, 255, 65, 0.6);
	overflow: hidden;
}
.hud-crosshair {
	position: absolute;
	top: 30%;
	left: 50%;
}
.crosshair-h {
	position: absolute;
	top: 0;
	left: -16px;
	width: 32px;
	height: 1px;
	background: #00ff41;
}
.crosshair-v {
	position: absolute;
	left: 0;
	top: -16px;
	width: 1px;
	height: 32px;
	background: #00ff41;
}

.hud-alt {
	position: absolute;
	right: 12px;
	top: 30%;
	transform: translateY(-50%);
	text-align: right;
}

.hud-attitude {
	position: absolute;
	left: 12px;
	top: 35%;
	transform: translateY(-50%);
	text-align: left;
}

.hud-data-label {
	font-size: 9px;
	opacity: 0.7;
	letter-spacing: 0.5px;
}
.hud-data-value {
	font-size: 14px;
	font-weight: bold;
	margin-bottom: 6px;
}
.hud-unit {
	font-size: 10px;
	font-weight: normal;
	opacity: 0.7;
	margin-left: 1px;
}

.video-background :deep(canvas),
.video-background :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
</style>
