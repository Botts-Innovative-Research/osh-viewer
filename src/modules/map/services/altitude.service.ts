import * as Cesium from 'cesium';

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
