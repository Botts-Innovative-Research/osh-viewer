<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer'
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView'
import { CesiumTerrainProvider, EllipsoidTerrainProvider, Ion, IonResource } from 'cesium'
import * as Cesium from 'cesium'
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView'
import { computed, onMounted, ref, watch } from 'vue'
import { useVisualizationStore } from '../stores/visualizationstore'
import { OSHVisualization } from '@/lib/OSHConnectDataStructs'
import { createLocationDataSource } from '@/components/visualizations/DataComposables'
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'

const visualizationStore = useVisualizationStore()
const mapLayerType = ref('cesium')
const mapView = ref<any>(null)
const currentVisualizations = ref<OSHVisualization[]>([])
const pmLayers = ref([])

const mapVisualizations = computed(() => {
  return visualizationStore.getVisualizationsByType('pointmarker')
})

const featureVisualizations = computed(() => {
  return visualizationStore.getVisualizationsByType('pointmarker-feature')
})

const cesiumToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN



onMounted(() => {

  if (mapLayerType.value === 'leaflet') {
    const leafletMapView = new LeafletView({
      container: 'cesiumContainer',
      layers: [],
      autoZoomOnFirstMarker: true
    })

    mapView.value = leafletMapView;

  } else {

    // TODO: make an env file
    Ion.defaultAccessToken = cesiumToken;

    // const customViewer = new Cesium.Viewer('cesiumContainer', {
    //   terrain: Cesium.Terrain.fromWorldTerrain(),
    //   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    //     Cesium.IonImageryProvider.fromAssetId(3), {}
    //   ),
    //   timeline: false,
    //   homeButton: false,
    //   navigationInstructionsInitiallyVisible: false,
    //   navigationHelpButton: true,
    //   geocoder: true,
    //   animation: false,
    //   fullscreenButton: false,
    //   baseLayerPicker: true
    // })

    const cesiumView = new CesiumView({
      container: 'cesiumContainer',
      // viewer: customViewer,
    })
    mapView.value = cesiumView

    console.log('[MapView] CesiumView created:', cesiumView)
  }
})

watch(mapVisualizations, (updated) => {
  // Remove visualizations that are no longer present
  const removed = currentVisualizations.value.filter(val => !updated.includes(val))
  for (const viz of removed) {
    // Remove corresponding layer from pmLayers and map
    const idx = currentVisualizations.value.indexOf(viz)
    if (idx !== -1) {
      currentVisualizations.value.splice(idx, 1)
      // Remove layer from pmLayers and mapView
      const pmLayer = pmLayers.value[idx]
      if (pmLayer && mapView.value) {
        mapView.value.removeLayer?.(pmLayer)
      }
      pmLayers.value.splice(idx, 1)
    }
  }

  // Add new visualizations
  const newFiltered = updated.filter(val => !currentVisualizations.value.includes(val))
  console.log('New visualizations:', newFiltered)
  for (const viz of newFiltered) {
    currentVisualizations.value.push(viz)
    let dsInstance = new SweApi('pm-datasource-' + randomUUID(), {
      endpointUrl: viz.visualizationComponents.dataSource.endpointUrl,
      resource: viz.visualizationComponents.dataSource.resource,
      tls: viz.visualizationComponents.dataSource.tls,
      protocol: viz.visualizationComponents.dataSource.protocol,
      startTime: viz.visualizationComponents.dataSource.startTime,
      endTime: viz.visualizationComponents.dataSource.endTime,
      mode: viz.visualizationComponents.dataSource.mode,
    })
    console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstance)
    const layerOpts = viz.visualizationComponents.dataLayer
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
    })
    pmLayers.value.push(pmLayer)
    mapView.value.addLayer(pmLayer)
    console.log('[MapView] Creating PointMarkerLayer:', pmLayer)
    dsInstance.connect()
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
  const newFiltered = updated.filter(val => !currentVisualizations.value.includes(val))

  if (mapLayerType.value === 'cesium') {
    for (const viz of newFiltered) {
      addCesiumMarker(viz)
    }

  } else {

    for (const viz of newFiltered) {
      currentVisualizations.value.push(viz)
      mapView.value.addMarker({
        location: {
          x: viz.geometry.coordinates[0],
          y: viz.geometry.coordinates[1],
          z: viz.geometry.coordinates[2] || 0
        },
        label: viz.name,
        labelOffset: [0, 0],
        icon: '/icons/map/map-marker.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        id: viz.id,
        markerId: viz.id + '-feature' + randomUUID()
      })
    }
  }
}, { deep: true })

function addCesiumMarker(viz: any) {
  console.log('[MapView] TEST Adding Cesium marker')
  const viewer = mapView.value.viewer
  const location = {
    x: viz.geometry.coordinates[0],
    y: viz.geometry.coordinates[1],
    z: viz.geometry.coordinates[2] || 10
  }

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
      z: viz.geometry.coordinates[2] || 0
    },
    label: viz.name,
    labelOffset: [0, 0],
    icon: '/icons/map/map-marker.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    id: viz.id,
    markerId: viz.id + '-feature' + randomUUID()
  }

  let markerEnt = mapView.value.addMarker(markerProps, undefined)

  mapView.value.addMarkerToLayer(markerEnt,  markerProps);
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
