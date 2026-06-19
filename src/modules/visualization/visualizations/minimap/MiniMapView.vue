<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as Cesium from 'cesium';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
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

const viewMode = ref<'platform' | 'follow' | 'overhead'>('follow');
const hasOrientation = ref(false);

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

function onLLAListener(dsInstance: typeof ConSysApi) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			const lon = data.Location.lon ?? 0;
			const lat = data.Location.lat ?? 0;
			receivedLLA.value = {
				lat,
				lon,
				alt: data.Location.alt ?? 0,
			};
			updateTerrainHeight(lon, lat);
		}
	};
}

function onOrientationListener(dsInstance: typeof ConSysApi) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			console.log('data',data)
			receivedOrientation.value = {
				yaw:
					data.Attitude?.yaw ??
					data.Orientation?.heading ??
					0,
				pitch: data.Attitude?.pitch ?? data.Orientation?.pitch ?? 0,
				roll: data.Attitude?.roll ?? data.Orientation?.roll ?? 0,
			};
			hasOrientation.value = true;
		}
	};
}


function updateCamera() {
	if (!mapView?.viewer) return;

	const lon = receivedLLA.value.lon;
	const lat = receivedLLA.value.lat;
	const alt = receivedLLA.value.alt;

	if (lon === 0 && lat === 0 && alt === 0) return;

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
				new Cesium.Cartesian3(0, -120, 50)
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

	viewer.scene.requestRender();
}

onMounted(async () => {
	mapView = new CesiumView({
		container: minimapContainerId,
		autoZoomOnFirstMarker: true,
		layers: [],
	});
	await new Promise(requestAnimationFrame);

	mapView.viewer.scene.globe.depthTestAgainstTerrain = false;
	mapView.viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
		requestVertexNormals: true,
	});

	for (const ds of props.datasource) {
		let dsInstance = createDatasource(ds);

		if (ds?.properties?.location) {
			onLLAListener(dsInstance);
		}
		if (ds?.properties?.orientation) {
			onOrientationListener(dsInstance);
		}

		dsInstance.connect();
		dsInstances.value.push(dsInstance);
	}

	addPointMarkerLayers();
});

watch([receivedLLA, receivedOrientation], () => {
	updateCamera();
}, { deep: true });

watch(viewMode, () => {
	if (mapView?.viewer) {
		mapView.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
	}
	updateCamera();
});

function addPointMarkerLayers() {
	if (!mapView) return;

	const pmVizs = visualizationStore.getVisualizationsByType('pointmarker');
	for (const viz of pmVizs) {
		if (duplicatedLayerIds.has(viz.id)) continue;
		if (Array.isArray(viz.visualizationComponents)) continue;

		const dsArray = viz.visualizationComponents.dataSource;
		if (!dsArray?.length) continue;

		const result = createPointMarkerLayer(viz, dsArray);
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
				class="ga-2"
			>
				<v-btn
					value="platform"
					:disabled="!hasOrientation"
				>
					<v-icon start>mdi-airplane</v-icon>
					Platform
				</v-btn>

				<v-btn value="follow">
					<v-icon start>mdi-camera-control</v-icon>
					Follow
				</v-btn>

				<v-btn value="overhead">
					<v-icon start>mdi-crosshairs-gps</v-icon>
					Overhead
				</v-btn>
			</v-btn-toggle>
		</div>
		<div :id="minimapContainerId" class="minimap-viewer"></div>
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
.minimap-viewer {
	width: 100%;
	height: 400px;
}
.minimap-viewer :deep(.cesium-viewer),
.minimap-viewer :deep(.cesium-widget),
.minimap-viewer :deep(.cesium-widget canvas) {
	width: 100% !important;
	height: 100% !important;
}
</style>
