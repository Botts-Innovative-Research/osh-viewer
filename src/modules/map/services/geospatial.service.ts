import * as Cesium from 'cesium';
import { MapPoint } from '@/modules/map/types';

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
