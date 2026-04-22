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
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { RoleDatastream } from '@/types/types';
import { createDatasource } from './menus/visualization-wizard/shared/helpers';
import { ILineOfBearingLayerProperties, IPointMarkerLayerProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import * as Cesium from "cesium";

// THIS token is working, taken from showcase examples :P
// Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODY0NTkzNS02NzI0LTQwNDktODk4Zi0zZDJjOWI2NTdmYTMiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI1ODJ9.IbAajOLYnsoyKy1BOd7fY1p6GH-wwNVMdMduA2IzGjA';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNDIyMzU2OC0wMWI4LTRjNGYtYTdiMy1kYjRmYzAwNGJkYTgiLCJpZCI6MzM1ODkzLCJpYXQiOjE3NTYzMDQ3MjZ9.5-F-lSal7TV6bHASnlpo5JCxamD0ppGPtQT7GUK5Ne4';

const visualizationStore = useVisualizationStore();
const mapView = ref<any>(null);
const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map())
const listDatasourceInstances = ref<SweApi[]>([]);

const iconBase = import.meta.env.VITE_VIEWER_ENDPOINT !== undefined ? import.meta.env.VITE_VIEWER_ENDPOINT : "";

const uiStore = useUIStore();
const waypointLayers = ref<PointMarkerLayer[]>([]);
const flightPathPolyline = ref<any>(null);

const mapLayerType = computed(() => {
  return uiStore.focusedMap
})

// TODO: Update feature visualization code
const featureVisualizations = computed(() => {
  return visualizationStore.getVisualizationsByType('pointmarker-feature');
});

/**
 * Toggle map type
 */
async function toggleMapType() {
  if (mapLayerType.value === 'leaflet') {
    const leafletMapView = new LeafletView({
      container: 'mapContainer',
      layers: [],
      autoZoomOnFirstMarker: true,
    });
    mapView.value = leafletMapView;
  } else {
    const cesiumView = new CesiumView({
      container: 'mapContainer',
      autoZoomOnFirstMarker: true,
      layers: [],
    });
    mapView.value = cesiumView;

    // Add 3D buildings tileset from Cesium Ion
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
    mapView.value.viewer.scene.primitives.add(tileset);
  }
}

onMounted(() => {
  toggleMapType()
});

watch(() => mapLayerType.value, (mapLayerType) => {
  if (mapView.value) {

    // Temporarily disconnect datasources
    listDatasourceInstances.value.forEach((ds: any) => ds.disconnect())

    // Destroy map and layers
    mapView.value.destroy();
    mapView.value = null;

    // Switch map type
    toggleMapType();

    // Hold new layers for mapItemLayers
    const newLayers = new Map();

    // Create new layers
    mapItemLayers.value.forEach((layer) => {
      // Add new PM Layers
      if (layer instanceof PointMarkerLayer) {
        const pmLayer = new PointMarkerLayer({
          ...layer.properties,
        })
        mapView.value.addLayer(pmLayer)
        newLayers.set(layer.properties.id, pmLayer)
      }
      // Add new LoB Layers
      else if (layer instanceof LoBLayer) {
        const lobLayer = new LoBLayer({
          ...layer.properties,
        })
        mapView.value.addLayer(lobLayer)
        newLayers.set(layer.properties.id, lobLayer)
      }
    })

    // Reset mapItemLayers to new layers
    mapItemLayers.value = newLayers;

    // Reconnect datasources
    listDatasourceInstances.value.forEach((ds: any) => ds.connect())
  }
})

watch(() => uiStore.cesiumIonAssetId, async (id) => {
  // Skip if not on Cesium or ID is null
  if (mapLayerType.value !== 'cesium' || !id) return;
  const viewer = mapView.value.viewer;

  const intId = Number(id);

  // Look up the asset type from Ion
  const token = Ion.defaultAccessToken;
  const base = Ion.defaultServer.toString().replace(/\/$/, '');
  // const response = await fetch(`${base}/v1/assets/${id}`, {
  const response = await fetch(`${Ion.defaultServer}/v1/assets/${intId}`, {
    method: 'GET',
    mode: 'cors',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    console.error(`[Ion] Could not find asset ${intId}`);
    return;
  }

  const asset = await response.json();

  switch (asset.type) {
    case '3DTILES': {
      const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(intId);
      viewer.scene.primitives.add(tileset);
      break;
    }
    case 'IMAGERY': {
      const provider = await Cesium.IonImageryProvider.fromAssetId(intId);
      viewer.imageryLayers.addImageryProvider(provider);
      break;
    }
    case 'TERRAIN': {
      viewer.scene.setTerrain(new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromIonAssetId(intId)));
      break;
    }
    case 'GLTF': {
      const resource = await Cesium.IonResource.fromAssetId(intId);
      viewer.entities.add({ model: { uri: resource, scale: 1.0 } });
      break;
    }
    case 'CZML': {
      const resource = await Cesium.IonResource.fromAssetId(intId);
      viewer.dataSources.add(Cesium.CzmlDataSource.load(resource));
      break;
    }
    case 'KML': {
      const resource = await Cesium.IonResource.fromAssetId(intId);
      viewer.dataSources.add(Cesium.KmlDataSource.load(resource));
      break;
    }
    case 'GEOJSON': {
      const resource = await Cesium.IonResource.fromAssetId(intId);
      viewer.dataSources.add(Cesium.GeoJsonDataSource.load(resource));
      break;
    }
    default:
      console.warn(`[Ion] Unsupported asset type: ${asset.type}`);
  }
})

watch(() => uiStore.cesiumIonAssetUrl, (url) => {
  // Skip if not on Cesium or ID is null
  if (mapLayerType.value !== 'cesium' || !url) return;
  const viewer = mapView.value.viewer;

  // Parse URL
  const parsed = new URL(url);
  console.log('service param:', parsed.searchParams.get('SERVICE'));
  console.log('all params:', [...parsed.searchParams.entries()]);
  const service = parsed.searchParams.get('SERVICE')?.toUpperCase();

  if (service === 'WMS') {
    const layers = parsed.searchParams.get('LAYERS') ?? parsed.searchParams.get('layers') ?? '';
    try {
      const provider = new Cesium.WebMapServiceImageryProvider({
        url: url.split('?')[0], // ← base URL only, no query params
        layers,
        parameters: { transparent: true, format: 'image/png' },
      });
      viewer.imageryLayers.addImageryProvider(provider);
    } catch (err) {
      console.error('[WMS] Failed:', err);
    }
    // const provider = new Cesium.WebMapServiceImageryProvider({
    //   url,
    //   layers,
    //   parameters: { transparent: true, format: 'image/png' },
    // });
    // viewer.imageryLayers.addImageryProvider(provider);
  }
  else if (service === 'WMTS') {
    const layer = parsed.searchParams.get('LAYER') ?? parsed.searchParams.get('layer') ?? '';
    const style = parsed.searchParams.get('STYLE') ?? parsed.searchParams.get('style') ?? 'default';
    const tileMatrixSetID = parsed.searchParams.get('TILEMATRIXSET') ?? parsed.searchParams.get('tilematrixset') ?? '';
    const format = parsed.searchParams.get('FORMAT') ?? parsed.searchParams.get('format') ?? 'image/png';
    const provider = new Cesium.WebMapTileServiceImageryProvider({
      url,
      layer,
      style,
      tileMatrixSetID,
      format,
    });
    viewer.imageryLayers.addImageryProvider(provider);
  }
  else if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}')) {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url
    });
    viewer.imageryLayers.addImageryProvider(provider);
  }
  // Add asset based on URL file type
  else if (url.endsWith('.json') || url.endsWith('.czml')) {
    viewer.dataSources.add(Cesium.CzmlDataSource.load(url));
  } else if (url.endsWith('.kml')) {
    viewer.dataSources.add(Cesium.KmlDataSource.load(url));
  } else if (url.endsWith('.geojson') || url.endsWith('.json')) {
    viewer.dataSources.add(Cesium.GeoJsonDataSource.load(url));
  } else if (url.endsWith('.gltf') || url.endsWith('.glb')) {
    viewer.entities.add({ model: { uri: url, scale: 1.0 } });
  } else {
    console.warn(`[Ion] Unsupported asset URL type: ${url}`);
  }
})

/**
 * Map click listener
 */
watch(
  mapView,
  (map) => {
    if (!map) return;

    // Handle leaflet map click
    if (mapLayerType.value === 'leaflet') {
      map.map.on('click', (event: any) => {
        const lat = event.latlng.lat;
        const lon = event.latlng.lng;
        if (uiStore.isGeoPTZSelected) taskGeoPtz(lat, lon, 100);
        if (uiStore.selectedWaypoints) uiStore.setCurrentLLA(lat, lon, 0);
      })
    }
    // Handle cesium map click
    else if (mapLayerType.value === 'cesium') {
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
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        if (uiStore.isGeoPTZSelected) taskGeoPtz(lat, lon, 100);
        if (uiStore.selectedWaypoints) uiStore.setCurrentLLA(lat, lon, 0);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }

  }
)

/**
 * Watch for changes to mapVisualizations to handle deletion/creation of new viz
 */
watch(
  () => visualizationStore.mapVisualizations.map(v => v.id),
  (newIds, oldIds) => {
    // Handle removed visualizations
    const removedVizIds = oldIds?.filter(
      (oldId) => !newIds.some((id) => id === oldId)
    );
    if (removedVizIds) deleteVisualizations(removedVizIds);

    // Handle added visualizations
    const addedVizIds = newIds?.filter(
      (newId) => !oldIds?.some((id) => id === newId)
    )
    if (addedVizIds) createVisualizations(addedVizIds);

  },
  { immediate: true, deep: true }
);

/**
 * Delete mapItemLayers and disconnect datasources for removed visualizations
 * 
 * @param removedVizIds - OSHVisualization IDs of visualizations to delete
 */
function deleteVisualizations(removedVizIds: string[]) {
  const removedDsIds: string[] = []

  for (const vizId of removedVizIds) {
    const layer = mapItemLayers.value.get(vizId);
    if (!layer) { console.log("Didn't find layer"); continue };

    // Collect datasource IDs
    removedDsIds.push(...layer.dataSourceIds);

    // Remove layer from the actual map safely
    try {
      if (mapView.value) {
        mapView.value.removeAllFromLayer(layer);
      }
    } catch (err) {
      console.warn(`[MapView] Failed to remove layer ${vizId}:`, err);
    }

    // Remove layer from list of map layers
    mapItemLayers.value.delete(vizId);
  }

  // Disconnect and remove datasources
  listDatasourceInstances.value = listDatasourceInstances.value.filter(
    (dsInstance: SweApi) => {
      // Find matching datasource IDs
      if (removedDsIds.includes(dsInstance.id)) {
        console.log("Disconnecting datasource:", dsInstance.id)
        dsInstance.disconnect();
        return false;
      }
      else return true;
    }
  )
}

/**
 * Create new visualizations based on viz type
 * 
 * @param addedVizIds - OSHVisualization IDs of visualizations to be added
 */
function createVisualizations(addedVizIds: string[]) {
  const newOSHVisualizations: OSHVisualization[] = addedVizIds
    .map(id => visualizationStore.getVisualizationById(id))
    .filter(Boolean) as OSHVisualization[];

  for (const viz of newOSHVisualizations) {
    const dsArray: ISweApiDataSourceProperties[] = viz.visualizationComponents.dataSource // Array of datasources
    const dsInstances: SweApi[] = []; // Array of SweApi instances for datasources

    if (viz.type === 'pointmarker') {
      // Undefined initially
      let getLocation: any;
      let getOrientation: any;
      let getMarkerId: any;

      for (const dsProps of dsArray) {
        const dsInstance = createDatasource(dsProps);

        // Check for location property
        if (dsProps.properties.location) {
          getLocation = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => {
              return {
                x: rec[dsProps.properties.location.property].lon,
                y: rec[dsProps.properties.location.property].lat,
                z: rec[dsProps.properties.location.property].alt || 0, // Default to 0 if altitude is not provided
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
                heading: rec[dsProps.properties.orientation.property].heading,
              }
            },
          }
        }
        // Check for markerId property
        if (dsProps.properties.markerId) {
          getMarkerId = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => {
              return rec[dsProps.properties.markerId.property];
            },
          }
        }

        dsInstance.connect();
        dsInstances.push(dsInstance);
        listDatasourceInstances.value.push(dsInstance); // Push to list of active datasources
      }

      console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstances)
      const layerOpts = viz.visualizationComponents.dataLayer as IPointMarkerLayerProperties
      const pmLayer = new PointMarkerLayer({
        ...layerOpts,
        name: viz.name,
        id: viz.id,
        dataSourceIds: dsInstances.map(ds => ds.id),
        ...(getLocation ? { getLocation } : {}),
        ...(getOrientation ? { getOrientation } : {}),
        ...(getMarkerId ? { getMarkerId } : {}),
      })
      mapItemLayers.value.set(viz.id, pmLayer)
      mapView.value.addLayer(pmLayer)
      console.log('[MapView] Creating PointMarkerLayer:', pmLayer)
    }
    else if (viz.type === 'lob') {
      let getOrigin: RoleDatastream | null = null;
      let getBearing: RoleDatastream | null = null;

      for (const dsProps of dsArray) {
        const dsInstance = createDatasource(dsProps);

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
        listDatasourceInstances.value.push(dsInstance); // Push to list of active datasources
      }

      if (!getOrigin || !getBearing) {
        console.log('[MapView] LoB datasource missing origin or bearing property');
      }

      console.log('[MapView] Creating datasource for LoBLayer:', dsInstances)
      const layerOpts = viz.visualizationComponents.dataLayer as ILineOfBearingLayerProperties;

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
            return bearingData.heading != null ? bearingData.heading : bearingData;
          },
        };
      }

      const lobLayer = new LoBLayer(lobLayerOpts)
      mapItemLayers.value.set(viz.id, lobLayer)
      mapView.value.addLayer(lobLayer);
      console.log('[MapView] Created LoBLayer:', lobLayer)
    }
    else if (viz.type === 'geoPtz') {
      for (const dsProps of dsArray) {
        const dsInstance = createDatasource(dsProps);
        dsInstance.connect();
        dsInstances.push(dsInstance);
        listDatasourceInstances.value.push(dsInstance); // Push to list of active datasources
      }

      console.log('[MapView] Creating datasource for GeoPTZ PointMarkerLayer:', dsInstances)
      const pmLayer = new PointMarkerLayer({
        name: 'GeoPTZ',
        label: 'GeoPTZ',
        id: viz.id,
        icon: `${iconBase}/icons/map/geoPtz-pin.svg`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        labelOffset: [-16, -32],
        dataSourceIds: dsInstances.map(ds => ds.id),
        getLocation: {
          dataSourceIds: [dsInstances.map(ds => ds.id)],
          handler: (rec: any) => {
            return {
              x: uiStore.currentLLA?.longitude,
              y: uiStore.currentLLA?.latitude,
              z: uiStore.currentLLA?.altitude,
            }
          },
        },
        getDescription: {
          dataSourceIds: [dsInstances.map(ds => ds.id)],
          handler: (rec: any) => {
            return (`
              <div>${uiStore.selectedGeoPTZ?.map((viz: OSHVisualization) => {
              return `${viz.name}`
            }).join(', ')}</div>
            `)
          }
        }
      })
      mapItemLayers.value.set(viz.id, pmLayer)
      mapView.value.addLayer(pmLayer)
      console.log('[MapView] Creating GeoPTZ PointMarkerLayer:', pmLayer)
    }
  }
}

/**
 * Based on given LLA, send GeoPTZ task
 * 
 * @param lat 
 * @param lon 
 * @param alt 
 */
function taskGeoPtz(lat: number, lon: number, alt: number) {
  uiStore.setCurrentLLA(lat, lon, alt);
  console.log('LLA:', uiStore.currentLLA)

  if (!uiStore.isGeoPTZSelected || !uiStore.selectedGeoPTZ) return;

  const command = {
    parameters: {
      lat: lat,
      lon: lon,
      alt: 120.0,
    },
  };
  uiStore.sendGeoPTZCommand(command); // Send command
}

/**
 * Create/delete GeoPTZ marker as selected GeoPTZ value changes
 */
watch(() => uiStore.selectedGeoPTZ, (geoPtz, oldGeoPtz) => {
  // If had a value, delete
  if (oldGeoPtz?.length) deleteVisualizations([oldGeoPtz[0].id]);
  // If has a new value, create new
  if (geoPtz?.length) createVisualizations([geoPtz[0].id]);
}, { deep: true })

/**
 * Fly to pointmarker when selected in visualizations panel
 */
watch(() => uiStore.selectedMapItem,
  (newVal) => {
    if (!newVal) return; // Only fly when a map item is selected

    const layer = mapItemLayers.value.get(newVal.id);
    if (!layer) return;
    const location = layer.getCurrentProps().location;
    if (!location) return;

    // Leaflet
    if (mapLayerType.value === 'leaflet') {
      mapView.value.map.flyTo([
        location.y,
        location.x,
      ]);
    }
    // Cesium
    else if (mapLayerType.value === 'cesium') {
      mapView.value.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(location.x, location.y - 0.001, location.z + 100), // Offset to see the marker itself
        orientation: {
          pitch: Cesium.Math.toRadians(-35)
        }
      })
    }


  }
);

const layerTypes = [
  'layerIdToPolylines',
  //these are not implemented yet, so u can comment them out tbh but i wouldnt remove them
  'layerIdToEllipsoids',
  'layerIdToPolygon',
  'layerIdToFrustum',
  'layerIdToDrapedImage'
]
watch(() => visualizationStore.layerVisibility.entries(),
  (entries) => {

    for (const [layerId, isVisible] of entries) {
      const layer = mapItemLayers.value.get(layerId);

      if (!layer) continue;

      const ids: string[] = layer.getIds();

      for (const id of ids) {
        const marker = mapView.value.layerIdToMarkers?.[id];
        const polyline = mapView.value.layerIdToPolylines?.[id];

        if (mapLayerType.value === 'leaflet') {
          // Handle PM and LoB
          if (marker) {
            marker.setOpacity(isVisible ? 1 : 0);
          }
          // Handle polyline
          if (polyline) {
            polyline.setStyle({ opacity: isVisible ? 0.8 : 0 });
          }

        }
        else if (mapLayerType.value === 'cesium') {
          // Handle LoB
          if (marker && polyline) {
            marker.show = isVisible;
            polyline.show = isVisible;
          }
          // Handle PM
          else if (marker) {
            marker.show = isVisible;
          }
          // Handle polyline
          else if (polyline) {
            polyline.show = isVisible;
          }
          mapView.value.viewer.scene.requestRender();
        }
      }
      console.log('[MapView] Layer visibility changed:', layerId, isVisible);
    }
  }, { deep: true, immediate: true })


/**
 * Handle cursor style for GeoPTZ selection
 */
watch(() => uiStore.isGeoPTZSelected, (geoPtz) => {
  // Leaflet
  if (mapLayerType.value === 'leaflet') {
    mapView.value.map.getContainer().style.cursor = geoPtz ? 'crosshair' : '';
  }
  // Cesium
  else if (mapLayerType.value === 'cesium') {
    mapView.value.viewer.canvas.style.cursor = geoPtz ? 'crosshair' : '';
  }
})

/**
 * Handle cursor style for Mission Planner selection
 */
watch(() => uiStore.selectedWaypoints, (waypoint) => {
  // Leaflet
  if (mapLayerType.value === 'leaflet') {
    mapView.value.map.getContainer().style.cursor = waypoint ? 'crosshair' : '';
  }
  // Cesium
  else if (mapLayerType.value === 'cesium') {
    mapView.value.viewer.canvas.style.cursor = waypoint ? 'crosshair' : '';
  }
})


/**
 * FlightPath watchers
 */
watch(() => uiStore.clearMissionWaypointsMarkers, (newVal) => {
  if (!newVal) return;

  for (const layer of waypointLayers.value) {
    mapView.value?.removeAllFromLayer(layer);
  }
  waypointLayers.value = [];

  if (mapLayerType.value === 'leaflet' && mapView.value?.map && flightPathPolyline.value) {
    mapView.value.map.removeLayer(flightPathPolyline.value);
    flightPathPolyline.value = null;
  } else if (mapLayerType.value === 'cesium' && mapView.value?.viewer && flightPathPolyline.value) {
    mapView.value.viewer.entities.remove(flightPathPolyline.value);
    flightPathPolyline.value = null;
  }

  uiStore.resetClearWaypointMarkersSignal();
});


watch(() => uiStore.missionWaypoints, (waypoints) => {
  if (!mapView.value) return;

  for (const layer of waypointLayers.value) {
    mapView.value.removeAllFromLayer(layer);
  }
  waypointLayers.value = [];

  if (mapLayerType.value === 'leaflet' && mapView.value?.map && flightPathPolyline.value) {
    mapView.value.map.removeLayer(flightPathPolyline.value);
    flightPathPolyline.value = null;
  } else if (mapLayerType.value === 'cesium' && mapView.value?.viewer && flightPathPolyline.value) {
    mapView.value.viewer.entities.remove(flightPathPolyline.value);
    flightPathPolyline.value = null;
  }
  waypoints.forEach(async (wp, index) => {
    const waypointLayer = new PointMarkerLayer({
      id: `waypoint-${index}`,
      name: `Waypoint ${index + 1}`,
      location: {
        x: wp.lon,
        y: wp.lat,
        z: wp.alt || 0
      },
      icon: '/icons/map/geoPtz-pin.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      label: `WP ${index + 1}`,
      labelColor: '#FFFFFF',
      labelOutlineColor: '#000000',
      labelSize: 14,
      labelOffset: [0, -36],
      defaultToTerrainElevation: true,
    });

    mapView.value.addLayer(waypointLayer);
    waypointLayers.value.push(waypointLayer);

    await waypointLayer.setData('waypoint', [{ data: { timestamp: Date.now() } }]);
    const props = waypointLayer.getProps();
    if (props.values.length > 0) {
      mapView.value.updateMarker(props.values[0]);
    }
  });

  if (waypoints.length >= 2) {
    if (mapLayerType.value === 'leaflet' && mapView.value?.map) {
      const latLngs = waypoints.map(wp => [wp.lat, wp.lon]);
      flightPathPolyline.value = L.polyline(latLngs, {
        color: 'red',
        weight: 5,
      }).addTo(mapView.value.map);
    } else if (mapLayerType.value === 'cesium' && mapView.value?.viewer) {

      const positions = waypoints.map(wp =>
        Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt || 0)
      );
      //https://sandcastle.cesium.com/index.html?id=polyline
      flightPathPolyline.value = mapView.value.viewer.entities.add({
        polyline: {
          positions: positions,
          width: 5,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.RED,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
          }),
          clampToGround: true,
        }
      });
    }
  }
},
  { deep: true }
);

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
