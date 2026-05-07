<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { Ion } from 'cesium';
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { computed, onMounted, ref, watch } from 'vue';
import { useVisualizationStore } from '../../../stores/visualizationstore';
import { useUIStore } from '@/stores/uistore';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { RoleDatastream } from '@/types/types';
import { createDatasource } from '@/components/menus/visualization-wizard/shared/helpers';
import { ILineOfBearingLayerProperties, IPointMarkerLayerProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import * as Cesium from "cesium";
import { useMapStore } from '@/stores/mapstore';
import { useMap } from '../composables/useMap';

// THIS token is working, taken from showcase examples :P
// Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODY0NTkzNS02NzI0LTQwNDktODk4Zi0zZDJjOWI2NTdmYTMiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI1ODJ9.IbAajOLYnsoyKy1BOd7fY1p6GH-wwNVMdMduA2IzGjA';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNDIyMzU2OC0wMWI4LTRjNGYtYTdiMy1kYjRmYzAwNGJkYTgiLCJpZCI6MzM1ODkzLCJpYXQiOjE3NTYzMDQ3MjZ9.5-F-lSal7TV6bHASnlpo5JCxamD0ppGPtQT7GUK5Ne4';

const { mapAdapter } = useMap()

// const visualizationStore = useVisualizationStore();
// const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map())
// const renderedCesiumLayers = ref<Map<string, any>>(new Map());
// const buildingsTileset = ref<Cesium.Cesium3DTileset | null>(null); // For toggling 3D buildings layer
// const terrainProvider = ref<Cesium.CesiumTerrainProvider | null>(null); // For toggling 3D terrain
// const listDatasourceInstances = ref<SweApi[]>([]);

// const iconBase = import.meta.env.VITE_VIEWER_ENDPOINT !== undefined ? import.meta.env.VITE_VIEWER_ENDPOINT : "";

// const waypointLayers = ref<PointMarkerLayer[]>([]);
// const flightPathPolyline = ref<any>(null);


// const layerTypes = [
//   'layerIdToPolylines',
//   //these are not implemented yet, so u can comment them out tbh but i wouldnt remove them
//   'layerIdToEllipsoids',
//   'layerIdToPolygon',
//   'layerIdToFrustum',
//   'layerIdToDrapedImage'
// ]

// watch(() => visualizationStore.layerVisibility.entries(),
//   (entries) => {

//     for (const [layerId, isVisible] of entries) {
//       const layer = mapItemLayers.value.get(layerId);

//       if (!layer) continue;

//       const ids: string[] = layer.getIds();

//       for (const id of ids) {
//         const marker = mapView.value.layerIdToMarkers?.[id];
//         const polyline = mapView.value.layerIdToPolylines?.[id];

//         if (mapLayerType.value === 'leaflet') {
//           // Handle PM and LoB
//           if (marker) {
//             marker.setOpacity(isVisible ? 1 : 0);
//           }
//           // Handle polyline
//           if (polyline) {
//             polyline.setStyle({ opacity: isVisible ? 0.8 : 0 });
//           }

//         }
//         else if (mapLayerType.value === 'cesium') {
//           // Handle LoB
//           if (marker && polyline) {
//             marker.show = isVisible;
//             polyline.show = isVisible;
//           }
//           // Handle PM
//           else if (marker) {
//             marker.show = isVisible;
//           }
//           // Handle polyline
//           else if (polyline) {
//             polyline.show = isVisible;
//           }
//           mapView.value.viewer.scene.requestRender();
//         }
//       }
//       console.log('[MapView] Layer visibility changed:', layerId, isVisible);
//     }
//   }, { deep: true, immediate: true })


/**
 * Handle cursor style for GeoPTZ selection
 */
// watch(() => mapStore.isGeoPTZSelected, (geoPtz) => {
//   // Leaflet
//   if (mapLayerType.value === 'leaflet') {
//     mapView.value.map.getContainer().style.cursor = geoPtz ? 'crosshair' : '';
//   }
//   // Cesium
//   else if (mapLayerType.value === 'cesium') {
//     mapView.value.viewer.canvas.style.cursor = geoPtz ? 'crosshair' : '';
//   }
// })

/**
 * Handle cursor style for Mission Planner selection
 */
// watch(() => mapStore.selectedWaypoints, (waypoint) => {
//   // Leaflet
//   if (mapLayerType.value === 'leaflet') {
//     mapView.value.map.getContainer().style.cursor = waypoint ? 'crosshair' : '';
//   }
//   // Cesium
//   else if (mapLayerType.value === 'cesium') {
//     mapView.value.viewer.canvas.style.cursor = waypoint ? 'crosshair' : '';
//   }
// })


/**
 * FlightPath watchers
 */
// watch(() => mapStore.clearMissionWaypointsMarkers, (newVal) => {
//   if (!newVal) return;

//   for (const layer of waypointLayers.value) {
//     mapView.value?.removeAllFromLayer(layer);
//   }
//   waypointLayers.value = [];

//   if (mapLayerType.value === 'leaflet' && mapView.value?.map && flightPathPolyline.value) {
//     mapView.value.map.removeLayer(flightPathPolyline.value);
//     flightPathPolyline.value = null;
//   } else if (mapLayerType.value === 'cesium' && mapView.value?.viewer && flightPathPolyline.value) {
//     mapView.value.viewer.entities.remove(flightPathPolyline.value);
//     flightPathPolyline.value = null;
//   }

//   mapStore.resetClearWaypointMarkersSignal();
// });

// watch(() => mapStore.missionWaypoints, (waypoints) => {
//   if (!mapView.value) return;

//   for (const layer of waypointLayers.value) {
//     mapView.value.removeAllFromLayer(layer);
//   }
//   waypointLayers.value = [];

//   if (mapLayerType.value === 'leaflet' && mapView.value?.map && flightPathPolyline.value) {
//     mapView.value.map.removeLayer(flightPathPolyline.value);
//     flightPathPolyline.value = null;
//   } else if (mapLayerType.value === 'cesium' && mapView.value?.viewer && flightPathPolyline.value) {
//     mapView.value.viewer.entities.remove(flightPathPolyline.value);
//     flightPathPolyline.value = null;
//   }
//   waypoints.forEach(async (wp, index) => {
//     const waypointLayer = new PointMarkerLayer({
//       id: `waypoint-${index}`,
//       name: `Waypoint ${index + 1}`,
//       location: {
//         x: wp.lon,
//         y: wp.lat,
//         z: wp.alt || 0
//       },
//       icon: '/icons/map/geoPtz-pin.svg',
//       iconSize: [32, 32],
//       iconAnchor: [16, 32],
//       label: `WP ${index + 1}`,
//       labelColor: '#FFFFFF',
//       labelOutlineColor: '#000000',
//       labelSize: 14,
//       labelOffset: [0, -36],
//       defaultToTerrainElevation: true,
//     });

//     mapView.value.addLayer(waypointLayer);
//     waypointLayers.value.push(waypointLayer);

//     await waypointLayer.setData('waypoint', [{ data: { timestamp: Date.now() } }]);
//     const props = waypointLayer.getProps();
//     if (props.values.length > 0) {
//       mapView.value.updateMarker(props.values[0]);
//     }
//   });

//   if (waypoints.length >= 2) {
//     if (mapLayerType.value === 'leaflet' && mapView.value?.map) {
//       const latLngs = waypoints.map(wp => [wp.lat, wp.lon]);
//       flightPathPolyline.value = L.polyline(latLngs, {
//         color: 'red',
//         weight: 5,
//       }).addTo(mapView.value.map);
//     } else if (mapLayerType.value === 'cesium' && mapView.value?.viewer) {

//       const positions = waypoints.map(wp =>
//         Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt || 0)
//       );
//       //https://sandcastle.cesium.com/index.html?id=polyline
//       flightPathPolyline.value = mapView.value.viewer.entities.add({
//         polyline: {
//           positions: positions,
//           width: 5,
//           material: new Cesium.PolylineOutlineMaterialProperty({
//             color: Cesium.Color.RED,
//             outlineWidth: 2,
//             outlineColor: Cesium.Color.BLACK,
//           }),
//           clampToGround: true,
//         }
//       });
//     }
//   }
// },
//   { deep: true }
// );

</script>

<template>
  <div class="maphero">
    <div class="cesium-container maphero" id="mapContainer"></div>
  </div>
</template>

<style>
.maphero {
  height: 100%;
  width: auto;
}
</style>
