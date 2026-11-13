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
import { getIconAnchor, ICON_BASE } from '@/lib/icons';
import { FoiLayer } from '@/stores/visualizationstore';
import { getMilSymbol } from './services/milIcon.service';
import { MapPoint } from '@/modules/map/types';
import { DEFAULT_POINTMARKER_LAYER_PROPERTIES } from '@/modules/visualization/types/layers';

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
	let getDescription: any;
	let filter: any;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		// Filter unlocalized frames (e.g. lat === 0 && lon === 0 or missing/NaN)
		filter = {
			dataSourceIds: [dsInstance.id],
			handler: (rec: any) => {
				let lat: any;
				let lon: any;
				if (dsProps.properties?.location) {
					const locConfig = dsProps.properties.location;
					if (locConfig.locationFormat === 'flat' && locConfig.property) {
						lat = rec[locConfig.property.lat];
						lon = rec[locConfig.property.lon];
					} else if (locConfig.property) {
						const locObj = rec[locConfig.property];
						if (locObj) {
							lat = locObj.lat ?? locObj.y;
							lon = locObj.lon ?? locObj.x;
						}
					}
				}
				if (lat === undefined || lon === undefined) {
					const locObj = rec.location ?? rec.position ?? rec.pos;
					if (locObj && typeof locObj === 'object') {
						lat = locObj.lat ?? locObj.y;
						lon = locObj.lon ?? locObj.x;
					} else {
						lat = rec.lat ?? rec.latitude;
						lon = rec.lon ?? rec.longitude;
					}
				}
				if (lat === undefined || lon === undefined || isNaN(Number(lat)) || isNaN(Number(lon))) {
					return false;
				}
				// Ignore (0,0) unlocalized frames from ADS-B/AIS
				if (Number(lat) === 0 && Number(lon) === 0) {
					return false;
				}
				return true;
			},
		};

		// Check for location property
		if (dsProps.properties?.location) {
			const locConfig = dsProps.properties.location;

			if (locConfig.locationFormat === 'flat') {
				getLocation = {
					dataSourceIds: [dsInstance.id],
					handler: async (rec: any) => {
						const lon = rec[locConfig.property.lon] ?? rec.lon ?? rec.longitude;
						const lat = rec[locConfig.property.lat] ?? rec.lat ?? rec.latitude;
						if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) {
							return { x: 0, y: 0, z: 0 };
						}
						const alt = locConfig.property.alt ? rec[locConfig.property.alt] : null;
						return {
							x: lon,
							y: lat,
							z: alt || (await getGroundAltitude(lon, lat)),
						};
					},
				};
			} else {
				getLocation = {
					dataSourceIds: [dsInstance.id],
					handler: async (rec: any) => {
						const locObj = rec[locConfig.property] ?? rec.location ?? rec.position ?? rec.pos;
						if (!locObj) return { x: 0, y: 0, z: 0 };
						const lon = locObj.lon ?? locObj.x ?? rec.lon ?? rec.longitude;
						const lat = locObj.lat ?? locObj.y ?? rec.lat ?? rec.latitude;
						if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) {
							return { x: 0, y: 0, z: 0 };
						}
						return {
							x: lon,
							y: lat,
							z: locObj.alt ?? locObj.z ?? (await getGroundAltitude(lon, lat)),
						};
					},
				};
			}
		}

		// Orientation property: configured or auto-detected heading/course
		getOrientation = {
			dataSourceIds: [dsInstance.id],
			handler: (rec: any) => {
				if (dsProps.properties?.orientation?.property) {
					const orient = rec[dsProps.properties.orientation.property];
					const h = orient?.heading ?? orient;
					if (h !== undefined && h !== null && !isNaN(Number(h))) {
						return { heading: Number(h) };
					}
				}
				const autoHeading = rec.heading ?? rec.cog ?? rec.track;
				if (
					autoHeading !== undefined &&
					autoHeading !== null &&
					!isNaN(Number(autoHeading)) &&
					Number(autoHeading) >= 0 &&
					Number(autoHeading) <= 360
				) {
					return { heading: Number(autoHeading) };
				}
				return { heading: 0 };
			},
		};

		// Marker ID: explicitly configured or auto-detected (e.g. unique AIS MMSI, ADS-B ICAO)
		getMarkerId = {
			dataSourceIds: [dsInstance.id],
			handler: (rec: any) => {
				if (dsProps.properties?.markerId?.property) {
					const id = getLayerId(rec, dsProps.properties.markerId.property);
					if (id !== undefined && id !== null && id !== '') {
						return String(id);
					}
				}
				// Auto-detect unique ship MMSI (AIS)
				if (rec.mmsi !== undefined && rec.mmsi !== null && rec.mmsi !== '') {
					return String(rec.mmsi);
				}
				if (rec.MMSI !== undefined && rec.MMSI !== null && rec.MMSI !== '') {
					return String(rec.MMSI);
				}
				// Auto-detect aircraft ICAO / Hex (ADS-B)
				if (rec.icao !== undefined && rec.icao !== null && rec.icao !== '') {
					return String(rec.icao);
				}
				if (rec.ICAO !== undefined && rec.ICAO !== null && rec.ICAO !== '') {
					return String(rec.ICAO);
				}
				if (rec.hex !== undefined && rec.hex !== null && rec.hex !== '') {
					return String(rec.hex);
				}
				// Common target identifier fields
				if (rec.targetId !== undefined && rec.targetId !== null && rec.targetId !== '') {
					return String(rec.targetId);
				}
				if (rec.entityId !== undefined && rec.entityId !== null && rec.entityId !== '') {
					return String(rec.entityId);
				}
				if (rec.trackId !== undefined && rec.trackId !== null && rec.trackId !== '') {
					return String(rec.trackId);
				}
				if (rec.id !== undefined && rec.id !== null && rec.id !== '') {
					return String(rec.id);
				}
				if (rec.vesselName !== undefined && rec.vesselName !== null && String(rec.vesselName).trim() !== '') {
					return String(rec.vesselName).trim();
				}
				if (rec.callsign !== undefined && rec.callsign !== null && String(rec.callsign).trim() !== '') {
					return String(rec.callsign).trim();
				}
				return viz.id;
			},
		};

		// Icon Color property: configured or unique color-hash per MMSI / target ID
		getIconColor = {
			dataSourceIds: [dsInstance.id],
			handler: (rec: any) => {
				const r = rec?.data && typeof rec.data === 'object' ? { ...rec.data, ...rec } : (rec || {});
				if (dsProps.properties?.pmIconColor?.property) {
					const c = colorHash(getLayerId(r, dsProps.properties.pmIconColor.property)).rgba;
					if (c) return c;
				}
				// Auto-assign distinct colors to unique vessels/targets
				const mmsi = r.mmsi ?? r.MMSI ?? r.mmsi_number;
				if (mmsi !== undefined && mmsi !== null && mmsi !== '') {
					return colorHash(String(mmsi)).rgba;
				}
				const icao = r.icao ?? r.ICAO ?? r.hex ?? r.HEX;
				if (icao !== undefined && icao !== null && icao !== '') {
					return colorHash(String(icao)).rgba;
				}
				const targetId = r.targetId ?? r.entityId ?? r.trackId ?? r.id;
				if (targetId !== undefined && targetId !== null && targetId !== '') {
					return colorHash(String(targetId)).rgba;
				}
				return viz.visualizationComponents?.dataLayer?.iconColor || '#FFCC00';
			},
		};

		// Label property: configured or auto-detected vesselName, callsign, MMSI
		getLabel = {
			dataSourceIds: [dsInstance.id],
			handler: (rec: any) => {
				const r = rec?.data && typeof rec.data === 'object' ? { ...rec.data, ...rec } : (rec || {});
				if (dsProps.properties?.pmLabel?.property) {
					const labelValue = r[dsProps.properties.pmLabel.property];
					if (labelValue !== undefined && labelValue !== null && labelValue !== '') {
						return typeof labelValue === 'object' ? JSON.stringify(labelValue) : String(labelValue);
					}
				}
				// Auto-detect vessel / flight / target label
				const vesselName = r.vesselName ?? r.vessel_name ?? r.shipName ?? r.ship_name ?? r.name ?? r.NAME ?? r.vessel;
				if (vesselName && String(vesselName).trim().length > 0) return String(vesselName).trim();
				const callsign = r.callsign ?? r.call_sign ?? r.callSign ?? r.CALLSIGN;
				if (callsign && String(callsign).trim().length > 0) return String(callsign).trim();
				const flight = r.flight ?? r.FLIGHT;
				if (flight && String(flight).trim().length > 0) return String(flight).trim();
				const mmsi = r.mmsi ?? r.MMSI ?? r.mmsi_number;
				if (mmsi !== undefined && mmsi !== null && mmsi !== '') return `MMSI: ${mmsi}`;
				const icao = r.icao ?? r.ICAO ?? r.hex ?? r.HEX;
				if (icao !== undefined && icao !== null && icao !== '') return `ICAO: ${icao}`;
				return viz.name;
			},
		};

		// Description property: detailed vessel / target metadata for tooltip/popup
		getDescription = {
			dataSourceIds: [dsInstance.id],
			handler: (rec: any) => {
				if (!rec) return viz.description || '';
				const r = rec?.data && typeof rec.data === 'object' ? { ...rec.data, ...rec } : rec;

				// Check explicitly configured description property
				if (dsProps.properties?.description?.property) {
					const val = r[dsProps.properties.description.property];
					if (val !== undefined && val !== null && val !== '') {
						return typeof val === 'object' ? JSON.stringify(val) : String(val);
					}
				}

				const rows: [string, any][] = [];

				// MMSI (AIS)
				const mmsi = r.mmsi ?? r.MMSI ?? r.mmsi_number ?? r.mmsiNumber;
				if (mmsi !== undefined && mmsi !== null && mmsi !== '') rows.push(['MMSI', mmsi]);

				// Vessel Name
				const vesselName = r.vesselName ?? r.vessel_name ?? r.shipName ?? r.ship_name ?? r.name ?? r.NAME ?? r.vessel;
				if (vesselName && String(vesselName).trim()) rows.push(['Vessel', String(vesselName).trim()]);

				// Callsign
				const callsign = r.callsign ?? r.call_sign ?? r.callSign ?? r.CALLSIGN;
				if (callsign && String(callsign).trim()) rows.push(['Callsign', String(callsign).trim()]);

				// Ship Type
				const shipType = r.shipType ?? r.ship_type ?? r.vesselType ?? r.vessel_type ?? r.shiptype ?? r.type ?? r.TYPE;
				if (shipType && String(shipType).trim()) rows.push(['Ship Type', String(shipType).trim()]);

				// Nav Status
				const navStatus = r.navStatus ?? r.nav_status ?? r.navstatus ?? r.status ?? r.STATUS ?? r.navigationStatus ?? r.navState;
				if (navStatus && String(navStatus).trim()) rows.push(['Status', String(navStatus).trim()]);

				// Speed (SOG)
				const sog = r.sog ?? r.SOG ?? r.speed ?? r.SPEED ?? r.speedOverGround ?? r.velocity ?? r.spd;
				if (sog !== undefined && sog !== null && !isNaN(Number(sog))) {
					rows.push(['Speed', `${Number(sog).toFixed(1)} kts`]);
				}

				// Heading
				const heading = r.heading ?? r.HEADING ?? r.trueHeading ?? r.true_heading ?? r.hdg;
				if (heading !== undefined && heading !== null && !isNaN(Number(heading)) && Number(heading) <= 360) {
					rows.push(['Heading', `${Number(heading).toFixed(1)}°`]);
				}

				// Course (COG)
				const cog = r.cog ?? r.COG ?? r.course ?? r.COURSE ?? r.courseOverGround ?? r.track ?? r.TRACK;
				if (cog !== undefined && cog !== null && !isNaN(Number(cog))) {
					rows.push(['Course', `${Number(cog).toFixed(1)}°`]);
				}

				// Position (Lat/Lon)
				const lat = r.lat ?? r.latitude ?? r.Latitude ?? r.y;
				const lon = r.lon ?? r.longitude ?? r.Longitude ?? r.x;
				if (lat !== undefined && lon !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lon)) && (Number(lat) !== 0 || Number(lon) !== 0)) {
					rows.push(['Position', `${Number(lat).toFixed(5)}°, ${Number(lon).toFixed(5)}°`]);
				}

				// Altitude
				const alt = r.alt ?? r.altitude ?? r.Altitude ?? r.z;
				if (alt !== undefined && alt !== null && !isNaN(Number(alt))) {
					rows.push(['Altitude', `${Number(alt).toFixed(0)} ft`]);
				}

				// Destination
				const dest = r.destination ?? r.Destination ?? r.dest ?? r.DEST;
				if (dest && String(dest).trim()) rows.push(['Destination', String(dest).trim()]);

				// ETA
				const eta = r.eta ?? r.ETA;
				if (eta && String(eta).trim()) rows.push(['ETA', String(eta).trim()]);

				// Draught / Dimensions
				const draught = r.draught ?? r.draft ?? r.Draught;
				if (draught && !isNaN(Number(draught))) rows.push(['Draught', `${Number(draught).toFixed(1)} m`]);
				if (r.length && r.width) rows.push(['Dimensions', `${r.length}m × ${r.width}m`]);

				// Rate of Turn
				const rot = r.rot ?? r.ROT ?? r.rateOfTurn;
				if (rot !== undefined && rot !== null && !isNaN(Number(rot))) rows.push(['Rate of Turn', String(rot)]);

				// ADS-B / Flight
				const icao = r.icao ?? r.ICAO ?? r.hex ?? r.HEX;
				if (icao && !mmsi) rows.push(['ICAO', String(icao)]);
				const flight = r.flight ?? r.FLIGHT;
				if (flight && String(flight).trim()) rows.push(['Flight', String(flight).trim()]);
				const squawk = r.squawk ?? r.SQUAWK;
				if (squawk) rows.push(['Squawk', String(squawk)]);

				// Fallback: If no recognized fields were found, enumerate all non-internal primitive fields in record
				if (rows.length === 0) {
					const skipKeys = new Set(['raw', 'bytes', 'data', 'blob', 'buffer', 'timestamp', 'time', '_id', 'id']);
					for (const [key, val] of Object.entries(r)) {
						if (skipKeys.has(key)) continue;
						if (val !== undefined && val !== null && typeof val !== 'object' && String(val).trim() !== '') {
							rows.push([key, String(val).trim()]);
						}
					}
				}

				if (rows.length === 0) return viz.description || '';

				return `
<table style="width:100%; border-collapse:collapse; font-size:12px; line-height:1.4;">
  <tbody>
    ${rows
			.map(
				([label, val]) =>
					`<tr><td style="padding:3px 6px; font-weight:600; color:#aaa; vertical-align:top; border-bottom:1px solid #333; white-space:nowrap;">${label}</td><td style="padding:3px 6px; color:#fff; border-bottom:1px solid #333;">${val}</td></tr>`
			)
			.join('')}
  </tbody>
</table>`.trim();
			},
		};

		// Check for milsymbol property
		if (dsProps.properties?.milSymbol) {
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
		if (viz.visualizationComponents.dataLayer.milSymbol) {
			icon = getMilSymbol(viz.visualizationComponents.dataLayer.milSymbol);
		} else {
			// If getIconColor is dynamic (e.g. per-vessel auto-color), generate the base icon as pure white (#FFFFFF).
			// In Cesium, billboard.color multiplies the icon image pixels; using a white base icon ensures the
			// resulting billboard renders in the exact, brilliant target color rather than being darkened or muddied!
			const baseColor = getIconColor ? '#FFFFFF' : viz.visualizationComponents.dataLayer.iconColor;
			icon = await getColoredIconUrl(
				`${ICON_BASE}${viz.visualizationComponents.dataLayer.icon}`,
				baseColor
			);
		}
	}

	const pmLayer = new PointMarkerLayer({
		...viz.visualizationComponents.dataLayer,
		name: viz.name,
		id: viz.id,
		...(icon ? { icon } : {}),
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(filter ? { filter } : {}),
		...(getLocation ? { getLocation } : {}),
		...(getOrientation ? { getOrientation } : {}),
		...(getMarkerId ? { getMarkerId } : {}),
		...(getIconColor ? { getIconColor } : {}),
		...(getLabel ? { getLabel } : {}),
		...(getIcon ? { getIcon } : {}),
		...(getDescription ? { getDescription } : {}),
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
		...DEFAULT_POINTMARKER_LAYER_PROPERTIES,
		name: 'GeoPTZ',
		label: 'GeoPTZ',
		id: vizId,
		icon,
		iconColor: useSettingsStore().geoPtzIconColor,
		location: {
			x: location.lon,
			y: location.lat,
			z: location.alt,
		},
		iconAnchor: getIconAnchor(useSettingsStore().geoPtzIcon),
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
		...DEFAULT_POINTMARKER_LAYER_PROPERTIES,
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
		labelColor: '#FFFFFF',
		labelOutlineColor: '#000000',
		iconAnchor: [16, 32],
		defaultToTerrainElevation: true,
		markerId: vizId + '-location' + randomUUID(),
	});

	const props = await setLayerData(locationLayer);

	return { layer: locationLayer, props };
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
		...DEFAULT_POINTMARKER_LAYER_PROPERTIES,
		id: foiLayer.geometry.id,
		location: {
			x: lon,
			y: lat,
			z: alt,
		},
		icon,
		iconColor: foiLayer.color,
		label: foiLayer.geometry.properties.properties.name,
		labelColor: '#FFFFFF',
		labelOutlineColor: '#000000',
		iconAnchor: getIconAnchor(foiLayer.icon),
		defaultToTerrainElevation: true,
		markerId: foiLayer.geometry.id + '-feature' + randomUUID(),
	});

	console.log(pmLayer);

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
