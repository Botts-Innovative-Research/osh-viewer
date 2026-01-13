<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { Ion } from 'cesium';
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { computed, onMounted, ref, watch } from 'vue';
import { useVisualizationStore } from '../stores/visualizationstore';
import { useUIStore } from '@/stores/uistore';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { sendCommand } from '@/lib/ControlstreamUtils';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { RoleDatastream } from '@/types/types';

const props = defineProps<{
  visualization: OSHVisualization;
}>();

const visualizationStore = useVisualizationStore();
const mapLayerType = ref('leaflet');
const mapView = ref<any>(null);
const currentVisualizations = ref<OSHVisualization[]>([]);
const pmLayers: PointMarkerLayer = ref([]);
const lobLayers = ref<any[]>([]); // Track LoB layers separately

const geoPtzTargetPM = ref<any>(null);
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
        var lat = event.latlng.lat;
        var lon = event.latlng.lng;

				// Send GeoPTZ command to selected GeoPTZ visualization
				const commandBaseUrl = selectedGeoPTZ.commandBaseUrl;
				const controlStreamId = selectedGeoPTZ.controlStreamId;
        const auth = selectedGeoPTZ.auth

        if (geoPtzTargetPM.value) {
          leafletMapView.map.removeLayer(geoPtzTargetPM.value);
        }
        geoPtzTargetPM.value = L.marker([lat, lon]).addTo(leafletMapView.map)

        // L.marker([lat, lon]).addTo(leafletMapView.map)
				const command = {
					parameters: {
						lat: lat,
						lon: lon,
						alt: 120.0,
					},
				};

				console.log('[MapView] Sending GeoPTZ command to selected GeoPTZ:', selectedGeoPTZ);
				sendCommand(commandBaseUrl, controlStreamId, command, auth);

				uiStore.setCurrentLLA(lat, lon, 120.0);
			}
		});
	}
  else {
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

watch(() => uiStore.selectedGeoPTZ,
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

watch(mapVisualizations, (updated) => {
  // Remove visualizations that are no longer present (only check same types, use ID comparison)
  const currentMapViz = currentVisualizations.value.filter(v => v.type === 'pointmarker' || v.type === 'pmorientation');
  const updatedIds = updated.map(v => v.id);
  const removed = currentMapViz.filter((val) => !updatedIds.includes(val.id));
  for (const viz of removed) {
    // Remove corresponding layer from pmLayers and map
    const idx = currentVisualizations.value.indexOf(viz);
    if (idx !== -1) {
      currentVisualizations.value.splice(idx, 1);
      const pmLayer = pmLayers.value[idx];
      if (pmLayer && mapView.value) {
        mapView.value.removeLayer?.(pmLayer);
      }
      pmLayers.value.splice(idx, 1);
    }
  }

  const currentIds = currentVisualizations.value.map(v => v.id);
  const newFiltered = updated.filter(val => !currentIds.includes(val.id))
  console.log('New visualizations:', newFiltered)
  for (const viz of newFiltered) {
    currentVisualizations.value.push(viz)

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
        connectorOpts: {
          username: datasource?.connectorOpts.username,
          password: datasource?.connectorOpts.password
        }
      });
      console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstance);
      const layerOpts = viz.visualizationComponents.dataLayer;
      const pmLayer = new PointMarkerLayer({
        name: viz.name,
        dataSourceIds: [dsInstance.id],
        getLocation: layerOpts.getLocation,
        label: viz.visualizationComponents.dataLayer.name,
        icon: '/icons/map/map-marker.svg',
        iconSize: [32, 32],
        labelOffset: [-16, -32],
      });
      pmLayers.value.push(pmLayer);
      mapView.value.addLayer(pmLayer);
      console.log('[MapView] Creating PointMarkerLayer:', pmLayer);
      dsInstance.connect();
    }
    else if (viz.type === 'pmorientation') {
      const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
          ? viz.visualizationComponents.dataSource
          : [viz.visualizationComponents.dataSource];

      const dsInstances: SweApi[] = [];
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
          connectorOpts: {
            username: dsProps?.connectorOpts.username,
            password: dsProps?.connectorOpts.password
          }
        });

        if (dsProps.properties.location) {
          getLocation = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => {
              return {
                x: rec[dsProps.properties.location.property] != null ? rec[dsProps.properties.location.property].lon : rec.lon,
                y: rec[dsProps.properties.location.property] != null ? rec[dsProps.properties.location.property].lat : rec.lat,
                z: rec[dsProps.properties.location.property] != null ? rec[dsProps.properties.location.property].alt : 0 // Default to 0 if altitude is not provided
              }
            },
          }
        }

        if (dsProps.properties.orientation) {
          getOrientation = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => {
              return {
                heading: rec[dsProps.properties.orientation.property].heading != null ? rec[dsProps.properties.orientation.property].heading : rec[dsProps.properties.orientation.property]
              }
            },
          }
        }

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
      const currentFeatureViz = currentVisualizations.value.filter(v => v.type === 'pointmarker-feature');
      const updatedIds = updated.map(v => v.id);
      const removed = currentFeatureViz.filter(val => !updatedIds.includes(val.id))
      for (const viz of removed) {
        const idx = currentVisualizations.value.indexOf(viz)
        if (idx !== -1) {
          currentVisualizations.value.splice(idx, 1)
        }
      }

      const currentIds = currentVisualizations.value.map(v => v.id);
      const newFiltered = updated.filter((val) => !currentIds.includes(val.id));

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

		if (newFiltered.length > 0 && updated.length > 0) {
			const bounds = L.latLngBounds(
				updated.map((viz) => [viz.geometry.coordinates[1], viz.geometry.coordinates[0]])
			);
			mapView.value.map.fitBounds(bounds, { padding: [50, 50] });
		}
	}
},
	{ deep: true }
);

watch(lobVisualizations, (updated) => {
      checkAndRemoveLob(updated);

      const currentIds = currentVisualizations.value.map(v => v.id);
      const newFiltered = updated.filter((val) => !currentIds.includes(val.id));
      for (const viz of newFiltered) {
        console.log('[MapView] Adding new LoB visualization:', viz);
        currentVisualizations.value.push(viz);

        const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
            ? viz.visualizationComponents.dataSource
            : [viz.visualizationComponents.dataSource];

        const dsInstances: SweApi[] = [];

        let getOrigin: RoleDatastream | null = null;
        let getBearing: RoleDatastream | null = null;

        for (const dsProps of dsArray) {
          const dsInstance = new SweApi('lob-datasource-' + randomUUID(), {
            endpointUrl: dsProps.endpointUrl,
            resource: dsProps.resource,
            tls: dsProps.tls,
            protocol: dsProps.protocol,
            startTime: dsProps.startTime,
            endTime: dsProps.endTime,
            mode: dsProps.mode,
            responseFormat: dsProps.responseFormat,
            connectorOpts: {
              username: dsProps?.connectorOpts.username,
              password: dsProps?.connectorOpts.password
            }
          });

          if (dsProps.properties.origin) {
            getOrigin = {
              id: dsInstance.id,
              property: dsProps.properties.origin.property
            };
          }
          if (dsProps.properties.bearing) {
            getBearing = {
              id: dsInstance.id,
              property: dsProps.properties.bearing.property
            };
          }

          dsInstance.connect();
          dsInstances.push(dsInstance);
        }

        if (!getOrigin || !getBearing) {
          console.log('[MapView] LoB datasource missing origin or bearing property');
          continue;
        }

        console.log('[MapView] Creating datasource for LoBLayer:', dsInstances)
        const layerOpts = viz.visualizationComponents.dataLayer;

        const layerId = `lob-layer-${viz.id}-${randomUUID()}`;

        let lobLayerOpts: any = {
          ...layerOpts,
          name: viz.name,
          dataSourceIds: dsInstances.map(ds => ds.id),
          id: layerId,
          lobId: viz.id,
          polylineId: viz.id,
          markerId: viz.id,
          length: (layerOpts.distanceKm || 10) * 1000,
        };

        if (getOrigin && getBearing) {
          lobLayerOpts.getOrigin = {
            dataSourceIds: [getOrigin.id],
            handler: (rec: any) => {
              const originData = rec[getOrigin?.property];
              return {
                x: originData != null ? originData.lon : rec.lon,
                y: originData != null ? originData.lat : rec.lat,
                z: originData != null ? originData.alt : rec.alt,
              };
            },
          };
          lobLayerOpts.getBearing = {
            dataSourceIds: [getBearing.id],
            handler: (rec: any) => {
              const bearingData = rec[getBearing?.property];
              if (!bearingData) return null;
              return bearingData.heading != null ? bearingData.heading : bearingData;
            },
          };
          lobLayerOpts.getLobId = {
            dataSourceIds: [getOrigin.id],
            handler: () => viz.id,
          };
        }

        const lobLayer = new LoBLayer(lobLayerOpts);

        lobLayers.value.push({ vizId: viz.id, layer: lobLayer, layerId: layerId });

        mapView.value.addLayer(lobLayer);
        console.log('[MapView] Created LoBLayer:', lobLayer)
      }
    },
    { deep: true }
);

function checkAndRemoveLob(updated: OSHVisualization[]) {
  const currentLobViz = currentVisualizations.value.filter(v => v.type === 'lob');
  const updatedIds = updated.map(v => v.id);
  const removed = currentLobViz.filter((val) => !updatedIds.includes(val.id));

  for (const viz of removed) {
    const idx = currentVisualizations.value.indexOf(viz);
    if (idx !== -1) {
      currentVisualizations.value.splice(idx, 1);

      if (viz.type === 'pointmarker') {
        const pmLayer = pmLayers.value[idx];
        if (pmLayer && mapView.value) {
          mapView.value.removeLayer?.(pmLayer);
        }
        pmLayers.value.splice(idx, 1);
      } else if (viz.type === 'pointmarker-feature') {
        mapView.value.removeLayer?.(viz.id);
      } else if (viz.type === 'lob') {
        const lobLayerIndex = lobLayers.value.findIndex(l => l.vizId === viz.id);
        if (lobLayerIndex !== -1) {
          const lobLayerEntry = lobLayers.value[lobLayerIndex];
          console.log('[MapView] Removing LoB layer:', lobLayerEntry.layerId);
          mapView.value.removeLayer?.(lobLayerEntry.layer);
          lobLayers.value.splice(lobLayerIndex, 1);
        }
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
