import { MapPoint } from '@/modules/map/types';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';

export type GeoOverlayType = 'circle' | 'polygon' | 'polyline';
export type GeofenceMode = 'include' | 'exclude';

export abstract class GeoOverlay {
	uuid: string;
	type: GeoOverlayType;
	isGeofence: boolean;
	borderColor: string;
	fillColor: string;
	geofenceMode?: GeofenceMode;

	constructor(
		type: GeoOverlayType,
		isGeofence = false,
		borderColor = 'blue',
		fillColor = 'transparent'
	) {
		this.uuid = randomUUID();
		this.type = type;
		this.isGeofence = isGeofence;
		this.borderColor = borderColor;
		this.fillColor = fillColor;
	}

	setBorderColor(color: string) {
		this.borderColor = color;
	}

	setFillColor(color: string) {
		this.fillColor = color;
	}

	setIsGeofence(isGeofence: boolean) {
		this.isGeofence = isGeofence;
		// If geofence, set default mode to include
		this.geofenceMode = isGeofence ? 'include' : undefined;
	}

	setGeofenceMode(mode: GeofenceMode) {
		this.geofenceMode = mode;
	}
}

export class CircleGeoOverlay extends GeoOverlay {
	center: MapPoint;
	radius: number;

	constructor(
		isGeofence = false,
		center: MapPoint,
		radius: number,
		borderColor?: string,
		fillColor?: string
	) {
		super('circle', isGeofence, borderColor, fillColor);
		this.center = center;
		this.radius = radius;
	}

	setCenter(center: MapPoint) {
		this.center = center;
	}

	setRadius(radius: number) {
		this.radius = radius;
	}
}

export class PolylineGeoOverlay extends GeoOverlay {
	points: MapPoint[] = [];

	constructor(
		isGeofence = false,
		points?: MapPoint | MapPoint[],
		borderColor?: string,
		fillColor?: string
	) {
		super('polyline', isGeofence, borderColor, fillColor);
		if (points) this.addPoints(points);
	}

	addPoints(point: MapPoint | MapPoint[]) {
		if (Array.isArray(point)) {
			this.points.push(...point);
		} else this.points.push(point);
	}

	removePoint(point: MapPoint) {
		this.points.splice(this.points.indexOf(point), 1);
	}

	clearPoints() {
		this.points = [];
	}
}

export class PolygonGeoOverlay extends GeoOverlay {
	points: MapPoint[] = [];

	constructor(
		isGeofence = false,
		points?: MapPoint | MapPoint[],
		borderColor?: string,
		fillColor?: string
	) {
		super('polygon', isGeofence, borderColor, fillColor);
		if (points) this.addPoints(points);
	}

	addPoints(point: MapPoint | MapPoint[]) {
		if (Array.isArray(point)) {
			this.points.push(...point);
		} else this.points.push(point);
	}

	removePoint(point: MapPoint) {
		this.points.splice(this.points.indexOf(point), 1);
	}

	clearPoints() {
		this.points = [];
	}
}
