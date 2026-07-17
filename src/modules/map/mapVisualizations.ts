import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import FrustumLayer from 'osh-js/source/core/ui/layer/FrustumLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import EllipseLayer from 'osh-js/source/core/ui/layer/EllipseLayer';
import PolylineLayer from 'osh-js/source/core/ui/layer/PolylineLayer';
import { setWaypointData } from './services/missionBuilder.service';
import { useSettingsStore } from '@/stores/settingsstore';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { getLayerId } from './services/layerId.service';
import { colorHash, getColoredIconUrl, getColoredSvgUrl } from './services/colorId.service';
import { SupportedMapLayer } from './supportedMapLayers';
import { getGroundAltitude } from './services/geospatial.service';
import { IConSysApiDataSourceProperties } from '../visualization/types/datasource';
import { setLayerData } from './services/foi.service';
import { ICON_BASE } from '@/lib/icons';
import { FoiLayer } from '@/stores/visualizationstore';
import { getMilSymbol } from './services/milIcon.service';
import { MapPoint } from '@/modules/map/types';

export interface ICreateMapVisualizationResult {
	vizLayer: SupportedMapLayer;
	dsInstances: (typeof ConSysApi)[];
}

export async function createMapVisualizations(
	viz: OSHVisualization
): Promise<ICreateMapVisualizationResult | null> {
	if (viz.type === 'pointmarker') {
		return await createPointMarkerLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'lob') {
		return createLoBLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'ellipse') {
		return createEllipseLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'polyline') {
		return createPolylineLayer(viz, viz.visualizationComponents.dataSource);
	} else if (viz.type === 'frustum') {
		return createFrustumLayer(viz, viz.visualizationComponents.dataSource);
	} else {
		console.warn(`Visualization type ${viz.type} not supported for map view`);
		return null;
	}
}

export async function createPointMarkerLayer(
	viz: OSHVisualization,
	dsArray: IConSysApiDataSourceProperties[]
): Promise<ICreateMapVisualizationResult> {
	// Ds instances created
	let dsInstances: (typeof ConSysApi)[] = [];

	// Undefined initially
	let getLocation: any;
	let getOrientation: any;
	let getMarkerId: any;
	let getIconColor: any;
	let getLabel: any;
	let getIcon: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for location property
		if (dsProps.properties.location) {
			getLocation = {
				dataSourceIds: [dsInstance.id],
				handler: async (rec: any) => {
					const lon = rec[dsProps.properties.location.property].lon;
					const lat = rec[dsProps.properties.location.property].lat;
					return {
						x: lon,
						y: lat,
						z:
							rec[dsProps.properties.location.property].alt ||
							(await getGroundAltitude(lon, lat)),
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
					return getLayerId(rec, dsProps.properties.markerId.property);
				},
			};
		}
		// Check for iconColor property
		if (dsProps.properties.pmIconColor) {
			getIconColor = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return colorHash(getLayerId(rec, dsProps.properties.pmIconColor.property)).rgba;
				},
			};
		}
		// Check for label property
		if (dsProps.properties.pmLabel) {
			getLabel = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					const labelValue = rec[dsProps.properties.pmLabel.property];
					if (labelValue === undefined || labelValue === null) return '';
					if (typeof labelValue === 'object') {
						return JSON.stringify(labelValue);
					}
					return labelValue?.toString() || '';
				},
			};
		}
		// Check for milsymbol property
		if (dsProps.properties.milSymbol) {
			getIcon = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return getMilSymbol(rec[dsProps.properties.milSymbol.property]);
				},
			};
		}

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	// Color the initial icon if not milsymbol
	let icon: string = '';
	if (!getIcon) {
		icon = await getColoredIconUrl(
			`${ICON_BASE}${viz.visualizationComponents.dataLayer.icon}`,
			viz.visualizationComponents.dataLayer.iconColor
		);
	}

	const pmLayer = new PointMarkerLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		...(icon ? { icon } : {}),
		defaultToTerrainElevation: true,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getLocation ? { getLocation } : {}),
		...(getOrientation ? { getOrientation } : {}),
		...(getMarkerId ? { getMarkerId } : {}),
		...(getIconColor ? { getIconColor } : {}),
		...(getLabel ? { getLabel } : {}),
		...(getIcon ? { getIcon } : {}),
	});

	const props = setLayerData(pmLayer);

	return { vizLayer: pmLayer, dsInstances };
}
export function createLoBLayer(
	viz: OSHVisualization,
	dsArray: IConSysApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: (typeof ConSysApi)[] = [];

	// Undefined initially
	let getOrigin: any;
	let getBearing: any;
	let getLobId: any;
	let getColor: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for origin property
		if (dsProps.properties.origin) {
			getOrigin = {
				dataSourceIds: [dsInstance.id],
				handler: async (rec: any) => {
					const lon = rec[dsProps.properties.origin.property].lon;
					const lat = rec[dsProps.properties.origin.property].lat;
					return {
						x: lon,
						y: lat,
						z:
							rec[dsProps.properties.origin.property].alt ||
							(await getGroundAltitude(lon, lat)),
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
		// Check for lobId property
		if (dsProps.properties.lobId) {
			getLobId = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return getLayerId(rec, dsProps.properties.lobId.property);
				},
			};
		}
		// Check for line color property
		if (dsProps.properties.lobLineColor) {
			getColor = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return colorHash(getLayerId(rec, dsProps.properties.lobLineColor.property))
						.rgba;
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
		...(getLobId ? { getLobId } : {}),
		...(getColor ? { getColor } : {}),
	});

	return { vizLayer: lobLayer, dsInstances };
}
export function createEllipseLayer(
	viz: OSHVisualization,
	dsArray: IConSysApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: (typeof ConSysApi)[] = [];

	// Undefined initially
	let getPosition: any;
	let getSemiMajorAxis: any;
	let getSemiMinorAxis: any;
	let getEllipseId: any;
	let getColor: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for position property
		if (dsProps.properties.position) {
			getPosition = {
				dataSourceIds: [dsInstance.id],
				handler: async (rec: any) => {
					const lon = rec[dsProps.properties.position.property].lon;
					const lat = rec[dsProps.properties.position.property].lat;
					return {
						x: lon,
						y: lat,
						z:
							rec[dsProps.properties.position.property].alt ||
							(await getGroundAltitude(lon, lat)),
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
		// Check for ellipse ID property
		if (dsProps.properties.ellipseId) {
			getEllipseId = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return getLayerId(rec, dsProps.properties.ellipseId.property);
				},
			};
		}
		// Check for color property
		if (dsProps.properties.ellipseColor) {
			getColor = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return colorHash(getLayerId(rec, dsProps.properties.ellipseColor.property))
						.rgba;
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
		...(getEllipseId ? { getEllipseId } : {}),
		...(getColor ? { getColor } : {}),
	});
	return { vizLayer: ellipseLayer, dsInstances };
}
export function createPolylineLayer(
	viz: OSHVisualization,
	dsArray: IConSysApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: (typeof ConSysApi)[] = [];

	// Undefined initially
	let getLocation: any;
	let getPolylineId: any;
	let getColor: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for location property
		if (dsProps.properties.location) {
			getLocation = {
				dataSourceIds: [dsInstance.id],
				handler: async (rec: any) => {
					const lon = rec[dsProps.properties.location.property].lon;
					const lat = rec[dsProps.properties.location.property].lat;
					return {
						x: lon,
						y: lat,
						z:
							rec[dsProps.properties.location.property].alt ||
							(await getGroundAltitude(lon, lat)),
					};
				},
			};
		}
		// Check for polylineId property
		if (dsProps.properties.polylineId) {
			getPolylineId = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return getLayerId(rec, dsProps.properties.polylineId.property);
				},
			};
		}
		// Check for color property
		if (dsProps.properties.polylineColor) {
			getColor = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return colorHash(getLayerId(rec, dsProps.properties.polylineColor.property))
						.rgba;
				},
			};
		}

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	const polylineLayer = new PolylineLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getLocation ? { getLocation } : {}),
		...(getPolylineId ? { getPolylineId } : {}),
		...(getColor ? { getColor } : {}),
	});

	return { vizLayer: polylineLayer, dsInstances };
}
export function createFrustumLayer(
	viz: OSHVisualization,
	dsArray: IConSysApiDataSourceProperties[]
): ICreateMapVisualizationResult {
	// Ds instances created
	let dsInstances: (typeof ConSysApi)[] = [];

	// Undefined initially
	let getOrigin: any;
	let getSensorOrientation: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Check for location property
		if (dsProps.properties.origin) {
			getOrigin = {
				dataSourceIds: [dsInstance.id],
				handler: async (rec: any) => {
					const lon = rec[dsProps.properties.origin.property].lon;
					const lat = rec[dsProps.properties.origin.property].lat;
					return {
						x: lon,
						y: lat,
						z:
							rec[dsProps.properties.origin.property].alt ||
							(await getGroundAltitude(lon, lat)),
					};
				},
			};
		}
		if (dsProps.properties.sensorOrientation) {
			getSensorOrientation = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return {
						yaw: rec[dsProps.properties.sensorOrientation.property].heading,
						pitch: rec[dsProps.properties.sensorOrientation.property].pitch,
						roll: rec[dsProps.properties.sensorOrientation.property].roll,
					};
				},
			};
		}

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	const pmLayer = new FrustumLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getOrigin ? { getOrigin } : {}),
		...(getSensorOrientation
			? { getSensorOrientation }
			: {
					sensorOrientation: {
						yaw: 0.0,
						pitch: 0.0,
						roll: 0.0,
					},
				}),
	});
	return { vizLayer: pmLayer, dsInstances };
}
export async function createGeoPTZLayer(
	location: { lat: number; lon: number; alt: number },
	selectedGeoPTZ: OSHVisualization[]
) {
	const vizId = `geoptz-${randomUUID()}`;

	// Color the geoptz icon
	const icon = await getColoredIconUrl(
		`${ICON_BASE}${useSettingsStore().geoPtzIcon}`,
		useSettingsStore().geoPtzIconColor
	);

	const geoPtzLayer = new PointMarkerLayer({
		name: 'GeoPTZ',
		label: 'GeoPTZ',
		id: vizId,
		icon,
		iconColor: useSettingsStore().geoPtzIconColor,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		labelOffset: [-16, -32],
		location: {
			x: location.lon,
			y: location.lat,
			z: location.alt,
		},
		defaultToTerrainElevation: true,
		markerId: vizId + '-geoptz' + randomUUID(),
		getDescription: {
			dataSourceIds: [],
			handler: (rec: any) => {
				return `
              <div>${selectedGeoPTZ
					?.map((viz: OSHVisualization) => {
						return `${viz.name}`;
					})
					.join(', ')}</div>
            `;
			},
		},
	});

	const props = await setLayerData(geoPtzLayer);

	return { layer: geoPtzLayer, props };
}
export async function createLocationLayer(
	location: {
		lat: number;
		lon: number;
		alt: number;
	},
	name: string,
	label: string
): Promise<{ layer: typeof PointMarkerLayer; props: any }> {
	const vizId = `location-${randomUUID()}`;
	let icon;
	if (name.endsWith('homeLocation')) {
		icon = await getColoredIconUrl(
			`${ICON_BASE}/icons/waypoint/home-map-marker.png`,
			'#FFFB00'
		);
	} else icon = await getColoredIconUrl(`${ICON_BASE}/icons/waypoint/round-pin.png`, '#00BFFF');

	const locationLayer = new PointMarkerLayer({
		id: vizId,
		name: name,
		label: label,
		location: {
			x: location.lon,
			y: location.lat,
			z: location.alt,
		},
		icon,
		iconColor: '#FFFFFF',
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		labelColor: '#FFFFFF',
		labelOutlineColor: '#000000',
		labelSize: 14,
		labelOffset: [0, -36],
		defaultToTerrainElevation: true,
		markerId: vizId + '-location' + randomUUID(),
	});

	const props = await setLayerData(locationLayer);

	return { layer: locationLayer, props };
}

export async function createWaypointLayer(
	waypoint: MapPoint,
	index: string
): Promise<{
	layer: typeof PointMarkerLayer;
	props: any;
}> {
	const icon = await getColoredIconUrl(`${ICON_BASE}/icons/waypoint/round-pin.png`, 'green');

	const waypointLayer = new PointMarkerLayer({
		id: `waypoint-${index}`,
		name: `Waypoint ${index + 1}`,
		location: {
			x: waypoint.lon,
			y: waypoint.lat,
			z: waypoint.alt || (await getGroundAltitude(waypoint.lon, waypoint.lat)),
		},
		icon,
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
export async function createFOILayer(foiLayer: FoiLayer) {
	const lon = Array.isArray(foiLayer.geometry.coordinates[0])
		? foiLayer.geometry.coordinates[0][0]
		: foiLayer.geometry.coordinates[0];
	const lat = Array.isArray(foiLayer.geometry.coordinates[1])
		? foiLayer.geometry.coordinates[1][0]
		: foiLayer.geometry.coordinates[1];
	const alt = !foiLayer.geometry.coordinates[2]
		? await getGroundAltitude(lon, lat)
		: Array.isArray(foiLayer.geometry.coordinates[2])
			? foiLayer.geometry.coordinates[2][0]
			: foiLayer.geometry.coordinates[2];

	// Color the foi icon
	const icon = await getColoredIconUrl(`${ICON_BASE}${foiLayer.icon}`, foiLayer.color);

	const pmLayer = new PointMarkerLayer({
		id: foiLayer.geometry.id,
		location: {
			x: lon,
			y: lat,
			z: alt,
		},
		icon,
		iconColor: foiLayer.color,
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		label: foiLayer.geometry.properties.properties.name,
		labelColor: '#FFFFFF',
		labelOutlineColor: '#000000',
		labelSize: 14,
		labelOffset: [0, -36],
		defaultToTerrainElevation: true,
		markerId: foiLayer.geometry.id + '-feature' + randomUUID(),
	});

	const props = await setLayerData(pmLayer);

	return { layer: pmLayer, props };
}

export function rebuildMapVisualizations(
	oldLayers: Map<string, SupportedMapLayer>
): Map<string, SupportedMapLayer> {
	const newLayers = new Map<string, SupportedMapLayer>();

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
		// Add new Ellipse Layers
		else if (layer instanceof EllipseLayer) {
			const ellipseLayer = new EllipseLayer({
				...layer.properties,
			});
			newLayers.set(layer.properties.id, ellipseLayer);
		}
		// Add new Polyline Layers
		else if (layer instanceof PolylineLayer) {
			const polylineLayer = new PolylineLayer({
				...layer.properties,
			});
			newLayers.set(layer.properties.id, polylineLayer);
		}
	});

	return newLayers;
}
