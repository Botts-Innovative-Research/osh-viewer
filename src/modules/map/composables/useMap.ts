import { useMapStore } from '@/stores/mapstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import * as Cesium from 'cesium';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { createMapVisualizations, rebuildMapVisualizations } from '../mapVisualizations';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { useGeoPTZ } from './useGeoPTZ';

export function useMap() {
	// Stores
	const mapStore = useMapStore();
	const visualizationStore = useVisualizationStore();

	// Composables
	const { taskGeoPTZ } = useGeoPTZ();

	// Map state
	const mapView = ref<any>(null);
	const mapType = computed(() => {
		return mapStore.focusedMap;
	});

	// Map of visualization ID to its corresponding visualization layer instance
	const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map());
	// List of all connected datasource instances created for map visualizations
	const listDataSourceInstances = ref<SweApi[]>([]);

	/* MAP INITIALIZATION/DESTRUCTION */
	async function initMap() {
		if (mapType.value === 'leaflet') {
			mapView.value = new LeafletView({
				container: 'mapContainer',
				layers: [],
				autoZoomOnFirstMarker: true,
			});
		} else {
			mapView.value = new CesiumView({
				container: 'mapContainer',
				autoZoomOnFirstMarker: true,
				layers: [],
			});

			// Wait for Cesium to be fully ready
			await new Promise(requestAnimationFrame);
		}
	}
	async function destroyMap() {
		if (!mapView.value) return;
		mapView.value.destroy();
		mapView.value = null;
	}
	async function switchMap() {
		// Temporarily disconnect datasources
		disconnectDatasources();

		await destroyMap();
		await initMap();

		// Rebuild layers
		const newLayers = rebuildMapVisualizations(mapItemLayers.value);
		newLayers.forEach((layer) => {
			mapView.value.addLayer(layer);
		});
		mapItemLayers.value = newLayers;

		// Reconnect datasources
		connectDatasources();
	}

	/** TOGGLE MAP */
	watch(mapType, async () => {
		await switchMap();
	});

	/* DATASOURCE MANAGEMENT */
	function connectDatasources() {
		listDataSourceInstances.value.forEach((ds: any) => ds.connect());
	}
	function disconnectDatasources() {
		listDataSourceInstances.value.forEach((ds: any) => ds.disconnect());
	}

	/* CREATE/DELETE VISUALIZATIONS */
	watch(
		() => visualizationStore.mapVisualizations.map((v) => v.id),
		(newIds, oldIds) => {
			// Handle removed visualizations
			const removedIds = oldIds?.filter((oldId) => !newIds.some((id) => id === oldId));
			if (removedIds) deleteMapVisualizations(removedIds);

			//Handle added visualizations
			const addedIds = newIds?.filter((newId) => !oldIds?.some((id) => id === newId));
			if (addedIds) {
				const newOSHVisualizations: OSHVisualization[] = addedIds
					.map((id) => visualizationStore.getVisualizationById(id))
					.filter(Boolean) as OSHVisualization[];

				for (const viz of newOSHVisualizations) {
					addMapVisualizationLayer(viz);
					console.log(`Added visualization with id ${viz.id} to map.`);
				}
			}
		},
		{ immediate: true, deep: true }
	);
	function addMapVisualizationLayer(viz: OSHVisualization) {
		console.log('[Map] Creating viz layer for:', viz.id);
		const result = createMapVisualizations(viz);
		if (result) {
			const { vizLayer, dsInstances } = result;
			console.log(`Created ${viz.type} Visualization:`, vizLayer);
			listDataSourceInstances.value.push(...dsInstances); // Push dsInstances to list of all active ds
			mapItemLayers.value.set(viz.id, vizLayer); // Store vizLayer instance for this viz.id
			mapView.value.addLayer(vizLayer); // Add vizLayer to map
		}
	}
	function deleteMapVisualizations(removedVizIds: string[]) {
		const removedDsIds: string[] = [];

		for (const vizId of removedVizIds) {
			const layer = mapItemLayers.value.get(vizId);
			if (!layer) continue; // Skip if no layer found for this vizId

			// Collect ds IDs
			removedDsIds.push(...layer.dataSourceIds);

			// Remove layer from the actual map safely
			try {
				if (mapView.value) mapView.value.removeAllFromLayer(layer);
			} catch (error) {
				console.warn(`Error removing layer for vizId ${vizId}:`, error);
			}

			// Remove layer from mapItemLayers
			mapItemLayers.value.delete(vizId);
		}

		// Disconnect and remove datasources
		listDataSourceInstances.value = listDataSourceInstances.value.filter(
			(dsInstance: SweApi) => {
				// Find matching datasource IDs to remove
				if (removedDsIds.includes(dsInstance.id)) {
					console.log('Disconnecting datasource:', dsInstance.id);
					dsInstance.disconnect();
					return false; // Remove from list
				}
				return true; // Keep in list
			}
		);
	}

	/* GEOPTZ */
	watch(
		() => mapStore.selectedGeoPTZ,
		(geoPtz, oldGeoPtz) => {
			// If had a value, delete
			if (oldGeoPtz?.length) {
				console.log("Deleting geoptz")
				deleteMapVisualizations([...oldGeoPtz.map((viz) => viz.id)]);
			}
			// If has a new value, create new
			if (geoPtz?.length) {
				addMapVisualizationLayer(geoPtz[0]);
			}
		},
		{ immediate: true, deep: true }
	);

	/** MAP INTERACTIONS */
	watch(mapView, (map) => {
		if (!map) return;

		// Handle map click
		let lat: number, lng: number;
		if (mapType.value === 'leaflet') {
			map.map.on('click', (event: any) => {
				lat = event.latlng.lat;
				lng = event.latlng.lng;
				if (mapStore.isGeoPTZSelected) taskGeoPTZ(lat, lng, 100);
				if (mapStore.selectedWaypoints) mapStore.setCurrentLLA(lat, lng, 0);
			});
		} else if (mapType.value === 'cesium') {
			const viewer = map.viewer;
			// Description box styling
			viewer.infoBox.frame.onload = function () {
				const doc = viewer.infoBox.frame.contentDocument;
				doc.body.style.backgroundColor = '#242424';
				doc.body.style.color = '#ffffff';
			};

			const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
			handler.setInputAction((click: any) => {
				const cartesian = viewer.camera.pickEllipsoid(
					click.position,
					viewer.scene.globe.ellipsoid
				);
				if (!cartesian) return;

				const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
				lat = Cesium.Math.toDegrees(cartographic.latitude);
				lng = Cesium.Math.toDegrees(cartographic.longitude);
				if (mapStore.isGeoPTZSelected) taskGeoPTZ(lat, lng, 100);
				if (mapStore.selectedWaypoints) mapStore.setCurrentLLA(lat, lng, 0);
			}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		}
	});
	//TODO: Cursor styling

	onMounted(() => {
		initMap();
	});

	return {
		mapView,
		initMap,
		destroyMap,
		switchMap,
		deleteMapVisualizations,
	};
}
