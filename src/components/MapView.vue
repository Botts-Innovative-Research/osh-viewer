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
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { RoleDatastream } from '@/types/types';
import { createDatasource } from './menus/visualization-wizard/shared/helpers';
import { ILineOfBearingLayerProperties, IPointMarkerLayerProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import * as Cesium from "cesium";

// First token isn't working for some reason?
//Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZWYzYjhiMy0wMzcwLTQxMTktOGY1OS0wYzM1NzNlOTI3NDMiLCJpZCI6Mzk4MzMsImlhdCI6MTc0ODIwNDA4OX0.HBox4N50pESMU1yJs33-0cNd22sTvIv0KetnMAJMdXU'

// THIS token is working, taken from showcase examples :P
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODY0NTkzNS02NzI0LTQwNDktODk4Zi0zZDJjOWI2NTdmYTMiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI1ODJ9.IbAajOLYnsoyKy1BOd7fY1p6GH-wwNVMdMduA2IzGjA';

const visualizationStore = useVisualizationStore();
const mapView = ref<any>(null);
const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map())
const listDatasourceInstances = ref<SweApi[]>([]);

const uiStore = useUIStore();
const flightPathTargetPM = ref<any[]>([]);
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
function toggleMapType() {
  if (mapLayerType.value === 'leaflet') {
    const leafletMapView = new LeafletView({
      container: 'mapContainer',
      layers: [],
      autoZoomOnFirstMarker: true,
    });
    mapView.value = leafletMapView;
    console.log("Now leaflet")
  } else {
    const cesiumView = new CesiumView({
      container: 'mapContainer',
      autoZoomOnFirstMarker: true,
      layers: [],
    });
    mapView.value = cesiumView;
    console.log("Now cesium")
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
        console.log(layer)
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
    if (!layer) {console.log("Didn't find layer"); continue};

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

  console.log(newOSHVisualizations);

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
              const prop = dsProps.properties.location.property;
              const locData = prop ? rec[prop] : null;

              // Nested object format: {lon, lat, alt}
              if (locData && typeof locData === 'object') {
                return {
                  x: locData.lon ?? locData.longitude ?? 0,
                  y: locData.lat ?? locData.latitude ?? 0,
                  z: locData.alt ?? locData.altitude ?? 0,
                };
              }

              // Flat record: look for common location field names at top level
              const lat = rec.latitude ?? rec.lat;
              const lon = rec.longitude ?? rec.lon;
              if (lat != null && lon != null) {
                return {
                  x: lon,
                  y: lat,
                  z: rec.altitude ?? rec.alt ?? 0,
                };
              }
              return null;
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
            const prop = getOrigin?.property;
            const originData = prop ? rec[prop] : null;

            // Nested object format: {lon, lat, alt} (e.g. Beast Kit location property)
            if (originData && typeof originData === 'object') {
              return {
                x: originData.lon ?? originData.longitude ?? 0,
                y: originData.lat ?? originData.latitude ?? 0,
                z: originData.alt ?? originData.altitude ?? 0,
              };
            }

            // Flat record: look for common location field names at top level
            const lat = rec.latitude ?? rec.lat;
            const lon = rec.longitude ?? rec.lon;
            if (lat != null && lon != null) {
              return {
                x: lon,
                y: lat,
                z: rec.altitude ?? rec.alt ?? 0,
              };
            }
            return null;
          },
        };
        lobLayerOpts.getBearing = {
          dataSourceIds: [getBearing.id],
          handler: (rec: any) => {
            const prop = getBearing?.property;
            const bearingData = prop ? rec[prop] : null;

            // Direct number (e.g. Kerby aoa, Beast Kit raw-lob)
            if (typeof bearingData === 'number') return bearingData;

            // Nested object with heading property
            if (bearingData && typeof bearingData === 'object') {
              return bearingData.heading ?? bearingData.aoa ?? bearingData.bearing ?? null;
            }

            // Fallback: look for common bearing fields at top level
            return rec.heading ?? rec.aoa ?? rec.bearing ?? rec['raw-lob'] ?? null;
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
        icon: '/icons/map/geoPtz-pin.svg',
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
 * Handle FlightPath cursor style
 */
watch(() => uiStore.selectedFlightPath, (flight) => {
  const map = mapView.value.map;
  const container = map.getContainer();
  container.style.cursor = flight ? 'crosshair' : ''
})

/**
 * FlightPath watchers
 */
watch(() => uiStore.clearFlightPathMarkersSignal, (newVal) => {
  if (newVal && mapView.value?.map) {
    for (const marker of flightPathTargetPM.value) {
      mapView.value.map.removeLayer(marker);
    }
    flightPathTargetPM.value = [];
    if (flightPathPolyline.value) {
      mapView.value.map.removeLayer(flightPathPolyline.value);
      flightPathPolyline.value = null;
    }
    uiStore.resetClearFlightPathMarkersSignal();
  }
}
);
watch(() => uiStore.flightPathWaypoints,
  (waypoints) => {
    if (!mapView.value?.map || mapLayerType.value !== 'leaflet') return;

    if (flightPathPolyline.value) {
      mapView.value.map.removeLayer(flightPathPolyline.value);
      flightPathPolyline.value = null;
    }

    if (waypoints.length >= 2) {
      const latLngs = waypoints.map(wp => [wp.lat, wp.lon]);
      flightPathPolyline.value = L.polyline(latLngs, {
        color: 'red',
        weight: 3,
        opacity: 0.8,
      }).addTo(mapView.value.map);
    }
  },
  { deep: true }
);

// TODO: Remove deprecated "new viz" code
// watch(mapVisualizations, (updated) => {

//   // Add new visualizations
//   const newFiltered = updated.filter(val => !currentVisualizations.value.includes(val))
//   console.log('New visualizations:', newFiltered)
//   for (const viz of newFiltered) {
//     currentVisualizations.value.push(viz)

//     // Handle PM only
//     if (viz.type === 'pointmarker') {
//       let datasource = null;
//       if (Array.isArray(viz.visualizationComponents.dataSource)) {
//         datasource = viz.visualizationComponents.dataSource[0];
//       } else {
//         datasource = viz.visualizationComponents.dataSource;
//       }

//       let dsInstance = new SweApi('pm-datasource-' + randomUUID(), {
//         endpointUrl: datasource.endpointUrl,
//         resource: datasource.resource,
//         tls: datasource.tls,
//         protocol: datasource.protocol,
//         startTime: datasource.startTime,
//         endTime: datasource.endTime,
//         mode: datasource.mode,
//         connectorOpts: {
//           username: datasource?.connectorOpts.username,
//           password: datasource?.connectorOpts.password
//         }
//       });
//       console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstance);
//       const layerOpts = viz.visualizationComponents.dataLayer;
//       const pmLayer = new PointMarkerLayer({
//         name: viz.name,
//         dataSourceIds: [dsInstance.id],
//         getLocation: layerOpts.getLocation,
//         label: viz.visualizationComponents.dataLayer.name,
//         icon: '/icons/map/map-marker.svg',
//         iconSize: [32, 32],
//         labelOffset: [-16, -32],
//       });
//       mapItemLayers.value.push(pmLayer);
//       mapView.value.addLayer(pmLayer);
//       console.log('[MapView] Creating PointMarkerLayer:', pmLayer);
//       dsInstance.connect();
//     } else if (viz.type === 'pmorientation') {
//       // Array of datasources
//       const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
//         ? viz.visualizationComponents.dataSource
//         : [viz.visualizationComponents.dataSource];

//       // Array of SweApi instances for datasources
//       const dsInstances: SweApi[] = [];

//       // Undefined initially
//       let getLocation: any;
//       let getOrientation: any;
//       let getMarkerId: any;

//       for (const dsProps of dsArray) {
//         const dsInstance = new SweApi(dsProps.id, {
//           endpointUrl: dsProps.endpointUrl,
//           resource: dsProps.resource,
//           tls: dsProps.tls,
//           protocol: dsProps.protocol,
//           startTime: dsProps.startTime,
//           endTime: dsProps.endTime,
//           mode: dsProps.mode,
//           responseFormat: dsProps.responseFormat,
//           connectorOpts: {
//             username: dsProps?.connectorOpts.username,
//             password: dsProps?.connectorOpts.password
//           }
//         });
//         //const dsInstance = createDatasource(dsProps);

//         // Check for location property
//         if (dsProps.properties.location) {
//           getLocation = {
//             dataSourceIds: [dsInstance.id],
//             handler: (rec: any) => {
//               return {
//                 x: rec[dsProps.properties.location.property].lon,
//                 y: rec[dsProps.properties.location.property].lat,
//                 z: rec[dsProps.properties.location.property].alt || 0, // Default to 0 if altitude is not provided
//               }
//             },
//           }
//         }
//         // Check for orientation property
//         if (dsProps.properties.orientation) {
//           getOrientation = {
//             dataSourceIds: [dsInstance.id],
//             handler: (rec: any) => {
//               return {
//                 heading: rec[dsProps.properties.orientation.property].heading,
//               }
//             },
//           }
//         }
//         // Check for markerId property
//         if (dsProps.properties.markerId) {
//           getMarkerId = {
//             dataSourceIds: [dsInstance.id],
//             handler: (rec: any) => {
//               return rec[dsProps.properties.markerId.property];
//             },
//           }
//         }

//         dsInstance.connect();
//         dsInstances.push(dsInstance);
//         listDatasourceInstances.value.push(dsInstance); // Push to list of active datasources
//       }

//       console.log('[MapView] Creating datasource for PointMarkerLayer:', dsInstances)
//       const layerOpts = viz.visualizationComponents.dataLayer
//       const pmLayer = new PointMarkerLayer({
//         ...layerOpts,
//         name: viz.name,
//         id: viz.id,
//         dataSourceIds: dsInstances.map(ds => ds.id),
//         ...(getLocation ? { getLocation } : {}),
//         ...(getOrientation ? { getOrientation } : {}),
//         ...(getMarkerId ? { getMarkerId } : {}),
//       })
//       mapItemLayers.value.push(pmLayer)
//       mapView.value.addLayer(pmLayer)
//       console.log('[MapView] Creating PointMarkerLayer:', pmLayer)
//     }
//   }
// }, { deep: true })
// watch(lobVisualizations, (updated) => {
//   checkAndRemove(updated);

//   const newFiltered = updated.filter((val) => !currentVisualizations.value.includes(val));
//   for (const viz of newFiltered) {
//     console.log('[MapView] Adding new LoB visualization:', viz);
//     currentVisualizations.value.push(viz);

//     // Array of datasources
//     const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
//       ? viz.visualizationComponents.dataSource
//       : [viz.visualizationComponents.dataSource];

//     //  Array of SweApi instances for datasources
//     const dsInstances: SweApi[] = [];

//     let getOrigin: RoleDatastream | null = null;
//     let getBearing: RoleDatastream | null = null;

//     for (const dsProps of dsArray) {
//       const dsInstance = new SweApi(dsProps.id, {
//         endpointUrl: dsProps.endpointUrl,
//         resource: dsProps.resource,
//         tls: dsProps.tls,
//         protocol: dsProps.protocol,
//         startTime: dsProps.startTime,
//         endTime: dsProps.endTime,
//         mode: dsProps.mode,
//         responseFormat: dsProps.responseFormat,
//         connectorOpts: {
//           username: dsProps?.connectorOpts.username,
//           password: dsProps?.connectorOpts.password
//         }
//       });

//       if (dsProps.properties.origin) {
//         getOrigin = {
//           id: dsInstance.id,
//           property: dsProps.properties.origin.property
//         };
//       }
//       if (dsProps.properties.bearing) {
//         getBearing = {
//           id: dsInstance.id,
//           property: dsProps.properties.bearing.property
//         };
//       }

//       dsInstance.connect();
//       dsInstances.push(dsInstance);
//       listDatasourceInstances.value.push(dsInstance); // Push to list of active datasources
//     }

//     if (!getOrigin || !getBearing) {
//       console.log('[MapView] LoB datasource missing origin or bearing property');
//     }

//     console.log('[MapView] Creating datasource for LoBLayer:', dsInstances)
//     const layerOpts = viz.visualizationComponents.dataLayer;
//     console.log('Icon size:', layerOpts.iconSize);
//     let lobLayerOpts: LoBLayer = {
//       ...layerOpts,
//       name: viz.name,
//       dataSourceIds: dsInstances.map(ds => ds.id),
//       id: viz.id,
//       length: (layerOpts.distanceKm || 10) * 1000,
//     };

//     if (getOrigin && getBearing) {
//       lobLayerOpts.getOrigin = {
//         dataSourceIds: [getOrigin.id],
//         handler: (rec: any) => {
//           const originData = rec[getOrigin?.property];
//           if (!originData) return null;
//           return {
//             x: originData.lon,
//             y: originData.lat,
//             z: originData.alt || 0,
//           };
//         },
//       };
//       lobLayerOpts.getBearing = {
//         dataSourceIds: [getBearing.id],
//         handler: (rec: any) => {
//           const bearingData = rec[getBearing?.property];
//           if (!bearingData) return null;
//           return bearingData.heading != null ? bearingData.heading : bearingData;
//         },
//       };
//     }

//     const lobLayer = new LoBLayer(lobLayerOpts)
//     mapItemLayers.value.push(lobLayer)
//     mapView.value.addLayer(lobLayer);
//     console.log('[MapView] Created LoBLayer:', lobLayer)
//   }
// }, { deep: true } );

// function checkAndRemove(updated: OSHVisualization[]) {
//   const removed = currentVisualizations.value.filter((val) => !updated.includes(val));
//   for (const viz of removed) {
//     const idx = currentVisualizations.value.indexOf(viz);
//     if (idx !== -1) {
//       currentVisualizations.value.splice(idx, 1);

//       if (viz.type === 'pointmarker') {
//         // Remove corresponding layer from mapItemLayers and map
//         const pmLayer = mapItemLayers.value[idx];
//         if (pmLayer && mapView.value) {
//           mapView.value.removeLayer?.(pmLayer);
//         }
//         mapItemLayers.value.splice(idx, 1);
//       } else if (viz.type === 'pointmarker-feature') {
//         mapView.value.removeLayer?.(viz.id);
//       } else if (viz.type === 'lob') {
//         mapView.value.removeLayer?.(viz.id);
//       }
//     }
//   }
// }

// TODO: Handle Cesium marker code
// function addCesiumMarker(viz: any) {
//   console.log('[MapView] TEST Adding Cesium marker');
//   const viewer = mapView.value.viewer;
//   const location = {
//     x: viz.geometry.coordinates[0],
//     y: viz.geometry.coordinates[1],
//     z: viz.geometry.coordinates[2] || 10,
//   };

//   /*viewer.entities.add({
//     // position: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
//     position: Cesium.Cartesian3.fromDegrees(location.x, location.y, location.z),
//     billboard: {
//       image: '/icons/map/map-marker.svg'
//     }
//   })*/

//   const markerProps = {
//     location: {
//       x: viz.geometry.coordinates[0],
//       y: viz.geometry.coordinates[1],
//       z: viz.geometry.coordinates[2] || 0,
//     },
//     label: viz.name,
//     labelOffset: [0, 0],
//     icon: '/icons/map/map-marker.svg',
//     iconSize: [32, 32],
//     iconAnchor: [16, 32],
//     id: viz.id,
//     markerId: viz.id + '-feature' + randomUUID(),
//   };

//   let markerEnt = mapView.value.addMarker(markerProps, undefined);

//   mapView.value.addMarkerToLayer(markerEnt, markerProps);
// }

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
