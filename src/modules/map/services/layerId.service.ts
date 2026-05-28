/**
 * Given selected layerID properties (markerId, polylineId, etc.),
 * returns a concatenated string of the property values to be used as the layerId for that visualization layer.
 * (getMarkerId, getPolylineId, etc. in mapVisualizations.ts)
 * @param properties
 * @returns
 */
export function getLayerId(properties: any): string {
	if (!Array.isArray(properties)) return properties; // If it's not an array, return as is

	// Concatenate property names with colon delimiter
	let layerIdProp: string = '';
	properties.map((prop: any) => {
		layerIdProp += prop + ':';
	});
	layerIdProp = layerIdProp.slice(0, -1); // Remove trailing colon

	return layerIdProp;
}
