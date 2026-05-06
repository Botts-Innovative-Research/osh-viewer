import { createDatasource } from '@/components/menus/visualization-wizard/shared/helpers';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { useMapStore } from '@/stores/mapstore';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { FrustumPrimitive } from '@/cesium/FrustumPrimitive.js';

const _frustumDebug = new URLSearchParams(window.location.search).has('frustumDebug');

// prettier-ignore
// @ts-ignore
const iconBase = import.meta.env.VITE_VIEWER_ENDPOINT !== undefined ? import.meta.env.VITE_VIEWER_ENDPOINT : '';

export interface ICreateMapVisualizationResult {
	vizLayer: PointMarkerLayer | LoBLayer;
	dsInstances: SweApi[];
}

export interface IFrustumVisualizationResult {
	dsInstances: SweApi[];
	cleanup: () => void;
}

export function createMapVisualizations(
	viz: OSHVisualization
): ICreateMapVisualizationResult | null {
	if (viz.type === 'pointmarker') {
		return createPointMarkerLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'lob') {
		return createLoBLayer(viz, viz.visualizationComponents.dataSource);
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
		icon: `${iconBase}/icons/map/geoPtz-pin.svg`,
		iconColor: '#FF0000',
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

/**
 * Creates a camera-frustum visualization driven by live OSH datasources.
 *
 * If existingDsInstances is provided, those are reused instead of creating new
 * connections (use this when piggybacking on a PointMarkerLayer's datasources).
 * dsArray and existingDsInstances must be parallel arrays of the same length.
 *
 * Expected datasource property roles:
 *   location    → rec[prop].lon / .lat / .alt
 *   orientation → rec[prop].heading / .pitch / .roll
 */
export function createFrustumVisualization(
	viz: OSHVisualization,
	dsArray: ISweApiDataSourceProperties[],
	viewer: any,
	existingDsInstances?: SweApi[],
): IFrustumVisualizationResult {
	const layerOpts = (viz.visualizationComponents?.dataLayer as any) ?? {};
	const primitive = new FrustumPrimitive(viewer, layerOpts);

	let lon: number | null = null;
	let lat: number | null = null;
	let alt = 120;
	let heading = 0;
	let pitch = 0;
	let roll = 0;

	function tryUpdate() {
		if (lon !== null && lat !== null) {
			primitive.update(lon, lat, alt, heading, pitch, roll);
		}
	}

	const dsInstances: SweApi[] = existingDsInstances ?? [];
	const channels: BroadcastChannel[] = [];

	if (!existingDsInstances) {
		for (const dsProps of dsArray) {
			const dsInstance = createDatasource(dsProps);
			dsInstance.connect();
			dsInstances.push(dsInstance);
		}
	}

	for (let i = 0; i < dsInstances.length; i++) {
		const dsInstance = dsInstances[i];
		const dsProps = dsArray[i];

		const channel = new BroadcastChannel((dsInstance as any).getTopicId());
		channel.onmessage = (event: MessageEvent) => {
			if (event.data.type !== 'data') return;
			for (const record of event.data.values ?? []) {
				const rec = record.data;
				if (!rec) continue;

				if (dsProps.properties.location) {
					const loc = rec[dsProps.properties.location.property];
					if (loc) {
						lon = loc.lon;
						lat = loc.lat;
						alt = loc.alt ?? 120;
					}
				}
				if (dsProps.properties.orientation) {
					const orient = rec[dsProps.properties.orientation.property];
					if (orient) {
						heading = (orient.heading ?? 0) - 180;
						const rawPitch = orient.pitch ?? 0;
						roll = -(orient.roll ?? 0);
						// iOS OSH app measures pitch as angle from nadir (0=down, 90=horizon, 180=up).
						// FrustumGeometry treats pitch=0 as zenith, -90=horizon, ±180=nadir.
						pitch = rawPitch - 180;
					}
				}
				if (_frustumDebug) {
					console.log('[Frustum] h=%f p_raw=%f p_cesium=%f r=%f', heading, (pitch + 90), pitch, roll);
				}
				tryUpdate();
			}
		};
		channels.push(channel);
	}

	return {
		dsInstances,
		cleanup: () => {
			channels.forEach((ch) => ch.close());
			primitive.destroy();
		},
	};
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
