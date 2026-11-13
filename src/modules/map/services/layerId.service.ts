/**
 * Given selected layerID properties (markerId, polylineId, etc.),
 * returns a concatenated string of the property values to be used as the layerId for that visualization layer.
 * (getMarkerId, getPolylineId, etc. in mapVisualizations.ts)
 * @param properties
 * @returns
 */
export function getLayerId(rec: any, properties: any): string {
	if (!rec || !properties) return '';

	// If single property, just return string value from record
	if (!Array.isArray(properties)) {
		const val = rec[properties];
		return val !== undefined && val !== null ? String(val) : '';
	}

	// If multiple properties, concatenate values with colon delimiter
	let id: string = '';
	properties.forEach((prop: any) => {
		const value = rec[prop];
		if (value !== null && value !== undefined && value !== '') {
			id += `${value}:`;
		}
	});
	return id.length > 0 ? id.slice(0, -1) : ''; // Remove trailing colon
}
