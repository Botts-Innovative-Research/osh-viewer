import { getLatestObservation } from '@/modules/visualization/services/datasource.service';
import ms from 'milsymbol';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';

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
export async function getInitialMilSymbol(dsInstance: typeof ConSysApi, id: string) {
	// Fetch latest observation
	console.log(dsInstance);
	const data = await getLatestObservation({
		id: dsInstance.name,
		endpointUrl: dsInstance.properties.endpointUrl,
		tls: dsInstance.properties.tls,
		connectorOpts: dsInstance.properties.connectorOpts,
	});
	console.log(data);
	// Return milsymbol
	return getMilSymbol(data.result[id]);
}
