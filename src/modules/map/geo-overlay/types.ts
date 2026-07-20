import { Geometry } from '@/lib/OSHConnectDataStructs';

// NOTE: Circle is not an existing GeoJSON type
export type GeoOverlayType = 'Point' | 'LineString' | 'Polygon' | 'Circle';
export type GeofenceMode = 'include' | 'exclude';
export const GeofenceExcludeDefaults = {
	geofenceMode: 'exclude',
	borderColor: '#FF0000',
	fillColor: '#FF000080',
};
export const GeofenceIncludeDefaults = {
	geofenceMode: 'include',
	borderColor: '#00FF00',
	fillColor: '#00FF0080',
};
/**
 * Properties for a GeoOverlay Geometry object
 */
export interface GeoOverlayProperties {
	fillColor: string;
	borderColor?: string; // For all except "Point" type
	radius?: number; // For "Circle" type, store radius here
	icon?: string; // For "Point" type, store icon path here
}

/**
 * Defines the structure of a GeoOverlay object, which represents a geometric shape on a map.
 * Includes properties for the geometry, type, and geofence settings.
 */
export class GeoOverlay {
	uuid: string;
	geometry: Geometry;
	name: string;
	type: GeoOverlayType;
	isGeofence: boolean;
	geofenceMode?: GeofenceMode;

	constructor(geometry: Geometry, name: string, isGeofence = false, geofenceMode?: GeofenceMode) {
		this.uuid = geometry.id;
		this.type = geometry.type as GeoOverlayType;
		this.geometry = geometry;
		this.name = name;
		this.isGeofence = isGeofence;
		this.geofenceMode = geofenceMode;
	}
}
