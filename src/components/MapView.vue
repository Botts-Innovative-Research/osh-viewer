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

// Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZWYzYjhiMy0wMzcwLTQxMTktOGY1OS0wYzM1NzNlOTI3NDMiLCJpZCI6Mzk4MzMsImlhdCI6MTc0ODIwNDA4OX0.HBox4N50pESMU1yJs33-0cNd22sTvIv0KetnMAJMdXU'

const visualizationStore = useVisualizationStore();
const mapLayerType = ref('leaflet');
const mapView = ref<any>(null);
const currentVisualizations = ref<OSHVisualization[]>([]);
const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map())
const listDatasourceInstances = ref<SweApi[]>([]);

const uiStore = useUIStore();
const geoPtzTargetPM = ref<any>(null);
const flightPathTargetPM = ref<any[]>([]);
const flightPathPolyline = ref<any>(null);


// TODO: Update feature visualization code
const featureVisualizations = computed(() => {
  return visualizationStore.getVisualizationsByType('pointmarker-feature');
});
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

/**
 * Determine mapLayerType
 * Handle click listener - GeoPTZ, FlightPath
 */
onMounted(() => {
  if (mapLayerType.value === 'leaflet') {
    const leafletMapView = new LeafletView({
      container: 'cesiumContainer',
      layers: [],
      autoZoomOnFirstMarker: true,
    });

    mapView.value = leafletMapView;

    // Add listener for point clicks
    mapView.value.map.on('click', (event: any) => {
      console.log('[MapView] Point clicked:', event);
      const geoPtzIcon = L.icon({
        iconUrl: '/icons/map/geoPtz-pin.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      // GEO PTZ
      const isGeoPTZSelected = uiStore.isGeoPTZSelected;
      if (isGeoPTZSelected) {
        var lat = event.latlng.lat;
        var lon = event.latlng.lng;

        // Send GeoPTZ command to selected GeoPTZ visualization
        if (geoPtzTargetPM.value) {
          mapView.value.map.removeLayer(geoPtzTargetPM.value);
        }
        geoPtzTargetPM.value = L.marker([lat, lon], { icon: geoPtzIcon, label: 'test' }).addTo(mapView.value.map)

        const command = {
          parameters: {
            lat: lat,
            lon: lon,
            alt: 120.0,
          },
        };

        uiStore.sendGeoPTZCommand(command);
        uiStore.setCurrentLLA(lat, lon, 120.0);
      }

      // FLIGHT PATH
      const selectedFlightPath = uiStore.selectedFlightPath;
      if (selectedFlightPath) {
        const lat = event.latlng.lat;
        const lon = event.latlng.lng;
        const alt = 100.0;

        flightPathTargetPM.value.push(L.marker([lat, lon], { icon: geoPtzIcon, title: "GeoPTZ" }).addTo(mapView.value.map));

        uiStore.setCurrentLLA(lat, lon, alt);
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

    // addCesiumMarker()
  }
});

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
    if (!layer) continue;

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
    if (viz.type === 'pmorientation') {
      // Array of datasources
      const dsArray: ISweApiDataSourceProperties[] = viz.visualizationComponents.dataSource

      // Array of SweApi instances for datasources
      const dsInstances: SweApi[] = [];

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
      console.log('[MapView] Adding new LoB visualization:', viz);
      currentVisualizations.value.push(viz);

      // Array of datasources
      const dsArray: ISweApiDataSourceProperties[] = viz.visualizationComponents.dataSource

      //  Array of SweApi instances for datasources
      const dsInstances: SweApi[] = [];

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
  }
}

/**
 * Fly to pointmarker when selected in visualizations panel
 */
watch(() => uiStore.selectedMapItem,
  (newVal) => {
    if (!newVal) return; // Only fly when a map item is selected
    const map = mapView.value.map;

    const layer = mapItemLayers.value.get(newVal.id);
    if (!layer) return;

    const location = layer.getCurrentProps().location;

    console.log('Found marker for selected map item:', location);

    // Fly to lat/lon
    if (location) {
      map.flyTo([
        location.y,
        location.x,
      ]);
    }

    // TESTING: Attempt to remove viz from map but not delete
    // Note: layer is pulled from mapItemLayers, where it stays until the visualization is deleted
    console.log(layer.props.id)

    // If visible, toggle off
    if (mapView.value.getLayer(layer.props.id)) {
      console.log(mapView.value.layers)
      mapView.value.removeAllFromLayer(layer); // THIS WORKS TO REMOVE FROM MAP - wrongggggg
      // mapView.value.layers.filter((item: any) => {
      //   item.props.id !== layer.props.id
      // })
      // mapView.value.layers.map((item: any) => {
      //   console.log(item.props.id)
      // })
      console.log(mapView.value.layers)
    }
    // Else not visible, toggle on
    else {
      // mapView.value.addLayer(layer)
    }

    // mapView.value.removeAllFromLayer(layer); // THIS WORKS TO REMOVE FROM MAP
    // mapView.value.addLayer(layer); // To add to map again... ?

    // console.log("Getting layer from mapview...", layer.props.id)
    // let mapLayer = mapView.value.getLayer(layer.props.id);
    // console.log("Found layer:", mapLayer)

    // console.log("Initial map view value", mapView.value.layers)
    // mapView.value.removeAllFromLayer(layer); // THIS WORKS TO REMOVE FROM MAP
    // console.log("NEW map view value", mapView.value.layers)
    
  }
);

/**
 * Handle change in GeoPTZ selection
 */
watch(() => uiStore.isGeoPTZSelected, (geoPtz) => {
  const map = mapView.value.map;
  const container = map.getContainer();
  container.style.cursor = geoPtz ? 'crosshair' : ''

  // If a geoPtz marker exists geoPTZ is not selected
  if (geoPtzTargetPM.value && !geoPtz) {
    console.log('Removing GeoPTZ marker');
    mapView.value.map.removeLayer(geoPtzTargetPM.value);
    geoPtzTargetPM.value = null;
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
    <!--    <v-btn @click="addCesiumMarker" position="absolute">Add Cesium Marker</v-btn>-->
    <div class="cesium-container maphero" id="cesiumContainer"></div>
  </div>
</template>

<style scoped>
.maphero {
  height: 100%;
}
</style>
