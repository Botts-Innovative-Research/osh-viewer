import * as Cesium from 'cesium';
import { MapPoint } from '@/modules/map/types';
import { BBox } from '@/lib/OSHConnectDataStructs';

/**
 * Given lat/lon, use Cesium to calculate ground level altitude.
 * Used for default altitude when not provided in a datastream.
 * @param lon
 * @param lat
 * @returns
 */
export async function getGroundAltitude(lon: number, lat: number) {
	const terrainProvider = await Cesium.createWorldTerrainAsync();

	const pointToSample = new Cesium.Cartographic(
		Cesium.Math.toRadians(lon),
		Cesium.Math.toRadians(lat)
	);

	try {
		const [updatedPoint] = await Cesium.sampleTerrainMostDetailed(terrainProvider, [
			pointToSample,
		]);

		if (updatedPoint && updatedPoint.height !== undefined) {
			return updatedPoint.height;
		} else {
			console.warn('Terrain data not available for this location.');
			return null;
		}
	} catch (error) {
		console.error('Error sampling terrain:', error);
		return null;
	}
}

/**
 * Given two LLA points, calculate the distance between them in meters
 * Used for radius of circle GeoOverlay
 * @param point1
 * @param point2
 */
export function getDistanceBetween(point1: MapPoint, point2: MapPoint) {
	const cartesian1 = Cesium.Cartesian3.fromDegrees(point1.lon, point1.lat, point1.alt);
	const cartesian2 = Cesium.Cartesian3.fromDegrees(point2.lon, point2.lat, point2.alt);

	return Cesium.Cartesian3.distance(cartesian1, cartesian2);
}

/**
 * Get the center point of a BBOX
 * Used for fly-to for GeoOverlays
 */
export async function getBboxCenter(bbox: BBox): Promise<{ x: number; y: number; z: number }> {
	const [minLon, minLat, maxLon, maxLat] = bbox;
	const lon = (minLon + maxLon) / 2;
	const lat = (minLat + maxLat) / 2;
	const alt = (await getGroundAltitude(lon, lat)) ?? 120;
	return {
		x: lon,
		y: lat,
		z: alt,
	};
}

/**
 * Get center point of a list of MapPoints
 * Used for centering the label of polygon/polyline in Cesium
 * @param points
 */
export function getCenterPoint(points: MapPoint[]): Cesium.Cartesian3 | undefined {
	// Initial validation
	if (!points.length) return undefined;
	const validPoints = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
	if (!validPoints.length) return undefined;

	const avgLat = validPoints.reduce((sum, p) => sum + p.lat, 0) / validPoints.length;
	const avgLon = validPoints.reduce((sum, p) => sum + p.lon, 0) / validPoints.length;
	const avgAlt = validPoints.reduce((sum, p) => sum + (p.alt ?? 0), 0) / validPoints.length;

	return Cesium.Cartesian3.fromDegrees(avgLon, avgLat, avgAlt);
}
