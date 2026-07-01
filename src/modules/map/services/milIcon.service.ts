import { getLatestObservation } from '@/modules/visualization/services/datasource.service';
import ms from 'milsymbol';
import { IConSysApiDataSourceProperties } from '@/modules/visualization/types/datasource';

/**
 * Based on a property ID, return GUCI milsymbol
 * @param id
 * @returns
 */
export function getMilSymbol(id: string) {
	return new ms.Symbol(id, {}).toDataURL();
}

/**
 * Make request for latest observation to get an initial milsymbol icon
 * @param dsInstance
 * @param id
 * @returns
 */
export async function getInitialMilSymbol(dsInstance: IConSysApiDataSourceProperties, id: string) {
	// Fetch latest observation
	console.log(dsInstance);
	const data = await getLatestObservation({
		id: dsInstance.id,
		endpointUrl: dsInstance.endpointUrl,
		tls: dsInstance.tls,
		connectorOpts: dsInstance.connectorOpts,
	});
	console.log(data);
	// Return milsymbol
	return getMilSymbol(data.result[id]);
}

/**
 * Return true/false if value is MIL-STD-2525 format
 * Checks if starts with data:image, indicating an icon was generated
 * @param value
 */
export function isMilSymbol(value: string): boolean {
	console.log(value.startsWith('data:image'));
	return value.startsWith('data:image');
}
