import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { Geometry, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { useMapStore } from '@/stores/mapstore';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import EllipseLayer from 'osh-js/source/core/ui/layer/EllipseLayer';
import { MapPoint } from './adapters/types';
import { setWaypointData } from './services/missionBuilder.service';
import { useSettingsStore } from '@/stores/settingsstore';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';

// prettier-ignore
// @ts-ignore
const iconBase = import.meta.env.VITE_VIEWER_ENDPOINT !== undefined ? import.meta.env.VITE_VIEWER_ENDPOINT : '';

export interface ICreateMapVisualizationResult {
	vizLayer: PointMarkerLayer | LoBLayer | EllipseLayer;
	dsInstances: SweApi[];
}

export function createMapVisualizations(
	viz: OSHVisualization
): ICreateMapVisualizationResult | null {
	if (viz.type === 'pointmarker') {
		return createPointMarkerLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'lob') {
		return createLoBLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'ellipse') {
		return createEllipseLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'geoPtz') {
		return createGeoPTZLayer(viz, viz.visualizationComponents.dataSource);
	} else {
		console.warn(`Visualization type ${viz.type} not supported for map view`);
		return null;
	}
}

export function createPointMarkerLayer(
	viz: OSHVisualization,
	dsArray: ISweApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: SweApi[] = [];

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
						z: rec[dsProps.properties.location.property].alt || 120, // Default to 120 if altitude is not provided
					};
				},
			};
		}
		// Check for orientation property
		if (dsProps.properties.orientation) {
			getOrientation = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return {
						heading: rec[dsProps.properties.orientation.property].heading,
					};
				},
			};
		}
		// Check for markerId property
		if (dsProps.properties.markerId) {
			getMarkerId = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return rec[dsProps.properties.markerId.property];
				},
			};
		}

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	const pmLayer = new PointMarkerLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		defaultToTerrainElevation: true,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getLocation ? { getLocation } : {}),
		...(getOrientation ? { getOrientation } : {}),
		...(getMarkerId ? { getMarkerId } : {}),
	});
	return { vizLayer: pmLayer, dsInstances };
}
export function createLoBLayer(
	viz: OSHVisualization,
	dsArray: ISweApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: SweApi[] = [];

	// Undefined initially
	let getOrigin: any;
	let getBearing: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for origin property
		if (dsProps.properties.origin) {
			getOrigin = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return {
						x: rec[dsProps.properties.origin.property].lon,
						y: rec[dsProps.properties.origin.property].lat,
						z: rec[dsProps.properties.origin.property].alt || 120, // Default to 120 if altitude is not provided
					};
				},
			};
		}
		// Check for bearing property
		if (dsProps.properties.bearing) {
			getBearing = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					const bearingValue = rec[dsProps.properties.bearing.property];
					if (!bearingValue) return null;
					return bearingValue.heading != null ? bearingValue.heading : bearingValue;
				},
			};
		}

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	const lobLayer = new LoBLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getOrigin ? { getOrigin } : {}),
		...(getBearing ? { getBearing } : {}),
	});

	return { vizLayer: lobLayer, dsInstances };
}
export function createEllipseLayer(
	viz: OSHVisualization,
	dsArray: ISweApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: SweApi[] = [];

	// Undefined initially
	let getPosition: any;
	let getSemiMajorAxis: any;
	let getSemiMinorAxis: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for position property
		if (dsProps.properties.position) {
			getPosition = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return {
						x: rec[dsProps.properties.position.property].lon,
						y: rec[dsProps.properties.position.property].lat,
						z: rec[dsProps.properties.position.property].alt || 120, // Default to 120 if altitude is not provided
					};
				},
			};
		}
		// Check for semi-major axis property
		if (dsProps.properties.semiMajorAxis) {
			getSemiMajorAxis = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return rec[dsProps.properties.semiMajorAxis.property];
				},
			};
		}
		// Check for semi-minor axis property
		if (dsProps.properties.semiMinorAxis) {
			getSemiMinorAxis = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return rec[dsProps.properties.semiMinorAxis.property];
				},
			};
		}

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	const ellipseLayer = new EllipseLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		defaultToTerrainElevation: true,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getPosition ? { getPosition } : {}),
		...(getSemiMajorAxis ? { getSemiMajorAxis } : {}),
		...(getSemiMinorAxis ? { getSemiMinorAxis } : {}),
	});
	return { vizLayer: ellipseLayer, dsInstances };
}
export function createGeoPTZLayer(
	viz: OSHVisualization,
	dsArray: ISweApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	const mapStore = useMapStore();
	// Ds instances created
	let dsInstances: SweApi[] = [];

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);
		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	const pmLayer = new PointMarkerLayer({
		name: 'GeoPTZ',
		label: 'GeoPTZ',
		id: viz.id,
		icon: `${iconBase}/icons/map/${useSettingsStore().geoPtzIcon}.png`,
		iconColor: useSettingsStore().geoPtzIconColor,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		labelOffset: [-16, -32],
		dataSourceIds: dsInstances.map((ds) => ds.id),
		getLocation: {
			dataSourceIds: dsInstances.map((ds) => ds.id),
			handler: (rec: any) => {
				if (!mapStore.currentLLA) return;
				return {
					x: mapStore.currentLLA?.longitude,
					y: mapStore.currentLLA?.latitude,
					z: mapStore.currentLLA?.altitude || 120, // Default to 120 if altitude is not provided
				};
			},
		},
		getDescription: {
			dataSourceIds: [dsInstances.map((ds) => ds.id)],
			handler: (rec: any) => {
				return `
              <div>${mapStore.selectedGeoPTZ
					?.map((viz: OSHVisualization) => {
						return `${viz.name}`;
					})
					.join(', ')}</div>
            `;
			},
		},
	});

	return { vizLayer: pmLayer, dsInstances };
}
export async function createWaypointLayer(
	waypoint: MapPoint,
	index: string
): Promise<{
	layer: PointMarkerLayer;
	props: any;
}> {
	const waypointLayer = new PointMarkerLayer({
		id: `waypoint-${index}`,
		name: `Waypoint ${index + 1}`,
		location: {
			x: waypoint.lon,
			y: waypoint.lat,
			z: waypoint.alt || 0,
		},
		icon: `${iconBase}/icons/map/geoPtz-pin.png`,
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		label: `WP ${index + 1}`,
		labelColor: '#FFFFFF',
		labelOutlineColor: '#000000',
		labelSize: 14,
		labelOffset: [0, -36],
		defaultToTerrainElevation: true,
	});

	const props = await setWaypointData(waypointLayer);

	return { layer: waypointLayer, props };
}
export function createFOIProps(geometry: Geometry) {
	const markerProps = {
		location: {
			x: Array.isArray(geometry.coordinates[0])
				? geometry.coordinates[0][0]
				: geometry.coordinates[0],
			y: Array.isArray(geometry.coordinates[1])
				? geometry.coordinates[1][0]
				: geometry.coordinates[1],
			z: !geometry.coordinates[2]
				? 0
				: Array.isArray(geometry.coordinates[2])
					? geometry.coordinates[2][0]
					: geometry.coordinates[2],
		},
		label: geometry.properties.properties.name,
		labelOffset: [0, 0],
		icon: `${iconBase}/icons/map/map-marker.png`,
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		id: geometry.id,
		markerId: geometry.id + '-feature' + randomUUID(),
	};
	return markerProps;
}

export function rebuildMapVisualizations(oldLayers: Map<string, PointMarkerLayer | LoBLayer>) {
	const newLayers = new Map<string, PointMarkerLayer | LoBLayer>();

	oldLayers.forEach((layer) => {
		// Add new PM Layers
		if (layer instanceof PointMarkerLayer) {
			const pmLayer = new PointMarkerLayer({
				...layer.properties,
			});
			newLayers.set(layer.properties.id, pmLayer);
		}
		// Add new LoB Layers
		else if (layer instanceof LoBLayer) {
			const lobLayer = new LoBLayer({
				...layer.properties,
			});
			newLayers.set(layer.properties.id, lobLayer);
		}
	});

	return newLayers;
}
