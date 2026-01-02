<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { Ion } from 'cesium';
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import { computed, onMounted, ref, watch } from 'vue';
import { useVisualizationStore } from '../stores/visualizationstore';
import { useUIStore } from '@/stores/uistore';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { sendCommand } from '@/lib/ControlstreamUtils';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { RoleDatastream } from '@/types/types';

const visualizationStore = useVisualizationStore();
const mapLayerType = ref('leaflet');
const mapView = ref<any>(null);
const currentVisualizations = ref<OSHVisualization[]>([]);
const pmLayers = ref([]);

const mapVisualizations = computed(() => {
	return visualizationStore.visualizations.filter(
		(viz) => viz.type === 'pointmarker' || viz.type === 'pmorientation'
	);
});

const featureVisualizations = computed(() => {
	return visualizationStore.getVisualizationsByType('pointmarker-feature');
});

const lobVisualizations = computed(() => {
	return visualizationStore.getVisualizationsByType('lob');
});

// Fetch UI store for GeoPTZ tool
const uiStore = useUIStore();

// Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZWYzYjhiMy0wMzcwLTQxMTktOGY1OS0wYzM1NzNlOTI3NDMiLCJpZCI6Mzk4MzMsImlhdCI6MTc0ODIwNDA4OX0.HBox4N50pESMU1yJs33-0cNd22sTvIv0KetnMAJMdXU'

onMounted(() => {
	if (mapLayerType.value === 'leaflet') {
		const leafletMapView = new LeafletView({
			container: 'cesiumContainer',
			layers: [],
			autoZoomOnFirstMarker: true,
		});

		mapView.value = leafletMapView;

		// GEOPTZ - Add listener for point clicks
		leafletMapView.map.on('click', (event: any) => {
			console.log('[MapView] Point clicked:', event);

			// Fetch selected GeoPTZ in UI store
			const selectedGeoPTZ = uiStore.selectedGeoPTZ;
			if (selectedGeoPTZ) {
				// Send GeoPTZ command to selected GeoPTZ visualization
				const commandBaseUrl = selectedGeoPTZ.commandBaseUrl;
				const controlStreamId = selectedGeoPTZ.controlStreamId;

				const command = {
					parameters: {
						lat: event.latlng.lat,
						lon: event.latlng.lng,
						alt: 0.0,
					},
				};

				console.log('[MapView] Sending GeoPTZ command to selected GeoPTZ:', selectedGeoPTZ);
				sendCommand(commandBaseUrl, controlStreamId, command);
			}
		});
	} else {
		/*const customViewer = new Cesium.Viewer('cesiumContainer', {
			terrain: Cesium.Terrain.fromWorldTerrain(),
			baseLayer: Cesium.ImageryLayer.fromProviderAsync(
				Cesium.IonImageryProvider.fromAssetId(3), {}
			),
			timeline: false,
			homeButton: false,
			navigationInstructionsInitiallyVisible: false,
			navigationHelpButton: true,
			geocoder: true,
			animation: false,
			fullscreenButton: false,
			baseLayerPicker: true
		})*/

		Ion.defaultAccessToken =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDlhZDVkOC0yMWZmLTQyMzYtYTU5Zi0yNTQ3MjAxYzFiM2YiLCJpZCI6Mzk4MzMsImlhdCI6MTc1MTk1MTk0OH0.0eS77LohXhxKTRDy9yhLo-wmYGTn9mz31-f4xer7eT0';

		const cesiumView = new CesiumView({
			container: 'cesiumContainer',
			// viewer: customViewer,
		});
		mapView.value = cesiumView;

		/*mapView.value.addMarker({
			location: {
				x: 0,
				y: 0,
				z: 0
			},
			label: 'TEST',
			labelOffset: [0, 0],
			icon: '/icons/map/map-marker.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 32],
			id: 'test-marker',
			markerId: 'test-marker' + '-feature' + randomUUID()
		})*/

		// TEST: remove this later
		// addCesiumMarker()
	}
});

watch(
	() => uiStore.selectedGeoPTZ,
	(newVal) => {
		const map = mapView.value.map;
		const container = mapView.value.map.getContainer();

		// Clear cursor styles
		container.style.cursor = '';

		if (newVal) {
			// Change cursor to crosshair when a GeoPTZ is selected
			container.style.cursor = 'crosshair';
		}
	}
);

watch(
	mapVisualizations,
	(updated) => {
		// Remove visualizations that are no longer present
		const removed = currentVisualizations.value.filter((val) => !updated.includes(val));
		for (const viz of removed) {
			// Remove corresponding layer from pmLayers and map
			const idx = currentVisualizations.value.indexOf(viz);
			if (idx !== -1) {
				currentVisualizations.value.splice(idx, 1);
				// Remove layer from pmLayers and mapView
				const pmLayer = pmLayers.value[idx];
				if (pmLayer && mapView.value) {
					mapView.value.removeLayer?.(pmLayer);
				}
				pmLayers.value.splice(idx, 1);
			}
		}

		// Add new visualizations
		const newFiltered = updated.filter(val => !currentVisualizations.value.includes(val))
		console.log('New visualizations:', newFiltered)
		for (const viz of newFiltered) {
			currentVisualizations.value.push(viz)

			// Handle PM only
			if (viz.type === 'pointmarker') {
				let datasource = null;
				if (Array.isArray(viz.visualizationComponents.dataSource)) {
					datasource = viz.visualizationComponents.dataSource[0];
				} else {
					datasource = viz.visualizationComponents.dataSource;
				}

				let dsInstance = new SweApi('pm-datasource-' + randomUUID(), {
					endpointUrl: datasource.endpointUrl,
					resource: datasource.resource,
					tls: datasource.tls,
					protocol: datasource.protocol,
					startTime: datasource.startTime,
					endTime: datasource.endTime,
					mode: datasource.mode,
				});
				console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstance);
				const layerOpts = viz.visualizationComponents.dataLayer;
				const pmLayer = new PointMarkerLayer({
					name: viz.name,
					dataSourceIds: [dsInstance.id],
					getLocation: layerOpts.getLocation,
					// getLocation: (rec, timestamp) => {
					//   return {
					//     x: rec.location.lat,
					//     y: rec.location.lon,
					//     z: rec.location.alt || 0
					//   }
					// },
					label: viz.visualizationComponents.dataLayer.name,
					icon: '/icons/map/map-marker.svg',
					iconSize: [32, 32],
					labelOffset: [-16, -32],
				});
				pmLayers.value.push(pmLayer);
				mapView.value.addLayer(pmLayer);
				console.log('[MapView] Creating PointMarkerLayer:', pmLayer);
				dsInstance.connect();
			} else if (viz.type === 'pmorientation') {
				// Array of datasources
				const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
					? viz.visualizationComponents.dataSource
					: [viz.visualizationComponents.dataSource];

				// Array of SweApi instances for datasources
				const dsInstances: SweApi[] = [];

				// Undefined initially
				let getLocation: any;
				let getOrientation: any;
				let getMarkerId: any;

				for (const dsProps of dsArray) {
					const dsInstance = new SweApi(dsProps.id, {
						endpointUrl: dsProps.endpointUrl,
						resource: dsProps.resource,
						tls: dsProps.tls,
						protocol: dsProps.protocol,
						startTime: dsProps.startTime,
						endTime: dsProps.endTime,
						mode: dsProps.mode,
						responseFormat: dsProps.responseFormat,
					});

					// Check for location property
					if (dsProps.properties.location) {
						getLocation = {
							dataSourceIds: [dsInstance.id],
							handler: (rec: any) => {
								return {
									x: rec[dsProps.properties.location].lon,
									y: rec[dsProps.properties.location].lat,
									z: rec[dsProps.properties.location].alt || 0, // Default to 0 if altitude is not provided
								}
							},
						}
					}
					// Check for orientation property
					if (dsProps.properties.orientation) {
						getOrientation = {
							dataSourceIds: [dsInstance.id],
							handler: (rec: any) => {
								return {
									heading: rec[dsProps.properties.orientation].heading,
								}
							},
						}
					}
					// Check for markerId property
					if (dsProps.properties.markerId) {
						getMarkerId = {
							dataSourceIds: [dsInstance.id],
							handler: (rec: any) => {
								return rec[dsProps.properties.markerId];
							},
						}
					}

					dsInstance.connect();
					dsInstances.push(dsInstance);
				}

				console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstances)
				const layerOpts = viz.visualizationComponents.dataLayer
				const pmLayer = new PointMarkerLayer({
					...layerOpts,
					name: viz.name,
					dataSourceIds: dsInstances.map(ds => ds.id),
					...(getLocation ? { getLocation } : {}),
					...(getOrientation ? { getOrientation } : {}),
					...(getMarkerId ? { getMarkerId } : {}),
				})
				pmLayers.value.push(pmLayer)
				mapView.value.addLayer(pmLayer)
				console.log('[MapView] Creating PointMarkerLayer:', pmLayer)
			}
		}
	}, { deep: true })

watch(featureVisualizations, (updated) => {
	// Remove feature visualizations that are no longer present
	const removed = currentVisualizations.value.filter(val => !updated.includes(val))
	for (const viz of removed) {
		const idx = currentVisualizations.value.indexOf(viz)
		if (idx !== -1) {
			currentVisualizations.value.splice(idx, 1)
			// Optionally remove marker from mapView if needed
		}
	}

	// Add new feature visualizations
	const newFiltered = updated.filter((val) => !currentVisualizations.value.includes(val));

	if (mapLayerType.value === 'cesium') {
		for (const viz of newFiltered) {
			addCesiumMarker(viz);
		}
	} else {
		for (const viz of newFiltered) {
			currentVisualizations.value.push(viz);
			mapView.value.addMarker({
				location: {
					x: viz.geometry.coordinates[0],
					y: viz.geometry.coordinates[1],
					z: viz.geometry.coordinates[2] || 0,
				},
				label: viz.name,
				labelOffset: [0, 0],
				icon: '/icons/map/map-marker.svg',
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				id: viz.id,
				markerId: viz.id + '-feature' + randomUUID(),
			});
		}
	}
},
	{ deep: true }
);

watch(
	lobVisualizations,
	(updated) => {
		checkAndRemove(updated);

		const newFiltered = updated.filter((val) => !currentVisualizations.value.includes(val));
		for (const viz of newFiltered) {
			console.log('[MapView] Adding new LoB visualization:', viz);
			currentVisualizations.value.push(viz);

			// Array of datasources
			const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
				? viz.visualizationComponents.dataSource
				: [viz.visualizationComponents.dataSource];

			//  Array of SweApi instances for datasources
			const dsInstances: SweApi[] = [];

			let getOrigin: RoleDatastream | null = null;
			let getBearing: RoleDatastream | null = null;

			for (const dsProps of dsArray) {
				const dsInstance = new SweApi(dsProps.id, {
					endpointUrl: dsProps.endpointUrl,
					resource: dsProps.resource,
					tls: dsProps.tls,
					protocol: dsProps.protocol,
					startTime: dsProps.startTime,
					endTime: dsProps.endTime,
					mode: dsProps.mode,
					responseFormat: dsProps.responseFormat,
				});

				if (dsProps.properties.origin) {
					getOrigin = {
						id: dsInstance.id,
						property: dsProps.properties.origin
					};
				}
				if (dsProps.properties.bearing) {
					getBearing = {
						id: dsInstance.id,
						property: dsProps.properties.bearing
					};
				}

				dsInstance.connect();
				dsInstances.push(dsInstance);
			}

			if (!getOrigin || !getBearing) {
				console.log('[MapView] LoB datasource missing origin or bearing property');
			}

			console.log('[MapView] Creating datasource for LoBLayer:', dsInstances)
			const layerOpts = viz.visualizationComponents.dataLayer;
			console.log('Icon size:', layerOpts.iconSize);
			let lobLayerOpts: LoBLayer = {
				...layerOpts,
				name: viz.name,
				dataSourceIds: dsInstances.map(ds => ds.id),
				id: viz.id,
				length: (layerOpts.distanceKm || 10) * 1000,
			};

			if (getOrigin && getBearing) {
				lobLayerOpts.getOrigin = {
					dataSourceIds: [getOrigin.id],
					handler: (rec: any) => {
						const originData = rec[getOrigin?.property];
						if (!originData) return null;
						return {
							x: originData.lon,
							y: originData.lat,
							z: originData.alt || 0,
						};
					},
				};
				lobLayerOpts.getBearing = {
					dataSourceIds: [getBearing.id],
					handler: (rec: any) => {
						const bearingData = rec[getBearing?.property];
						if (!bearingData) return null;
						return bearingData.heading;
					},
				};
			}

			const lobLayer = new LoBLayer(lobLayerOpts)
			mapView.value.addLayer(lobLayer);
			console.log('[MapView] Created LoBLayer:', lobLayer)
		}
	},
	{ deep: true }
);

function checkAndRemove(updated: OSHVisualization[]) {
	const removed = currentVisualizations.value.filter((val) => !updated.includes(val));
	for (const viz of removed) {
		const idx = currentVisualizations.value.indexOf(viz);
		if (idx !== -1) {
			currentVisualizations.value.splice(idx, 1);

			if (viz.type === 'pointmarker') {
				// Remove corresponding layer from pmLayers and map
				const pmLayer = pmLayers.value[idx];
				if (pmLayer && mapView.value) {
					mapView.value.removeLayer?.(pmLayer);
				}
				pmLayers.value.splice(idx, 1);
			} else if (viz.type === 'pointmarker-feature') {
				mapView.value.removeLayer?.(viz.id);
			} else if (viz.type === 'lob') {
				mapView.value.removeLayer?.(viz.id);
			}
		}
	}
}

function addCesiumMarker(viz: any) {
	console.log('[MapView] TEST Adding Cesium marker');
	const viewer = mapView.value.viewer;
	const location = {
		x: viz.geometry.coordinates[0],
		y: viz.geometry.coordinates[1],
		z: viz.geometry.coordinates[2] || 10,
	};

	/*viewer.entities.add({
		// position: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
		position: Cesium.Cartesian3.fromDegrees(location.x, location.y, location.z),
		billboard: {
			image: '/icons/map/map-marker.svg'
		}
	})*/

	const markerProps = {
		location: {
			x: viz.geometry.coordinates[0],
			y: viz.geometry.coordinates[1],
			z: viz.geometry.coordinates[2] || 0,
		},
		label: viz.name,
		labelOffset: [0, 0],
		icon: '/icons/map/map-marker.svg',
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		id: viz.id,
		markerId: viz.id + '-feature' + randomUUID(),
	};

	let markerEnt = mapView.value.addMarker(markerProps, undefined);

	mapView.value.addMarkerToLayer(markerEnt, markerProps);
}
</script>

<template>
	<div class="maphero">
		<!--    <v-btn @click="addCesiumMarker" position="absolute">Add Cesium Marker</v-btn>-->
		<div class="cesium-container maphero" id="cesiumContainer"></div>
	</div>
</template>

<style scoped>
.maphero {
	height: 100%;
}
</style>
