import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import DataStream from 'osh-js/source/core/sweapi/datastream/DataStream.js';
import ObservationFilter from 'osh-js/source/core/sweapi/observation/ObservationFilter.js';
import { Ref } from 'vue';
import { ISweApiDataSourceProperties } from '../types/datasource';

/**
 * Create a SweApi datasource from given datasource properties
 *
 * @param dsProps - Array of datasource properties to create SweApi object
 * @returns Generated SweApi datasource instance
 */
export function createDatasource(dsProps: ISweApiDataSourceProperties) {
	const dsInstance = new SweApi(dsProps.id, {
		endpointUrl: dsProps.endpointUrl,
		resource: dsProps.resource,
		tls: dsProps.tls,
		protocol: dsProps.protocol,
		startTime: dsProps.startTime,
		endTime: dsProps.endTime,
		mode: dsProps.mode,
		responseFormat: dsProps.responseFormat,
		connectorOpts: {
			username: dsProps?.connectorOpts.username ?? '',
			password: dsProps?.connectorOpts.password ?? '',
		},
	});
	return dsInstance;
}

/**
 * Disconnects SweApi datasources
 *
 * @param dsInstances
 */
export function disconnectDatasources(dsInstances: Ref<SweApi[]>) {
	const raw = dsInstances.value;

	const dsList = Array.isArray(raw) ? raw : raw ? [raw] : [];
	for (const ds of dsList) {
		console.log('[Disconnect Datasources] Disconnecting datasource:', ds);
		ds.disconnect();
	}
}

/**
 * Fetches the latest observation from a datasource
 *
 * @param dsProps - Datasource properties containing endpoint, id, and auth info
 * @returns Promise resolving to the latest observation data, or null if not found
 */
export const getLatestObservation = async (dsProps: {
	id: string;
	endpointUrl: string;
	tls: boolean;
	connectorOpts?: { username: string; password: string };
}): Promise<any | null> => {
	const networkProperties = {
		endpointUrl: dsProps.endpointUrl,
		tls: dsProps.tls,
		connectorOpts: dsProps.connectorOpts ?? { username: '', password: '' },
	};

	const datastream = new DataStream({ id: dsProps.id }, networkProperties);

	const results = await datastream.searchObservations(
		new ObservationFilter({ resultTime: 'latest' }),
		1
	);

	const obsResult = await results.nextPage();
	return obsResult[0];
};
