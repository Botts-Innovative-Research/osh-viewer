/**
 * Given selected layerID properties (markerId, polylineId, etc.),
 * returns a concatenated string of the property values to be used as the layerId for that visualization layer.
 * (getMarkerId, getPolylineId, etc. in mapVisualizations.ts)
 * @param properties
 * @returns
 */
export function getLayerId(rec: any, properties: any): string {
	// If single property, just return value from record
	if (!Array.isArray(properties)) {
		return rec[properties];
	}

	// If multiple properties, concatenate values with colon delimiter
	let id: string = '';
	properties.forEach((prop: any) => {
		const value = rec[prop];
		if (value !== null) {
			id += `${value}:`;
		}
	});
	return id.slice(0, -1); // Remove trailing colon
}
