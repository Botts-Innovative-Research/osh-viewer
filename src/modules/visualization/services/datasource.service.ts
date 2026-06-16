import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import DataStream from 'osh-js/source/core/sweapi/datastream/DataStream.js';
import ObservationFilter from 'osh-js/source/core/sweapi/observation/ObservationFilter.js';
import { Ref } from 'vue';
import { ISweApiDataSourceProperties } from '../types/datasource';
import { useDataStreamStore } from '@/stores/datastreamstore';
import DataStreamFilter from 'osh-js/source/core/sweapi/datastream/DataStreamFilter';

/**
 * Takes datasource ID as parameter
 * @returns
 */
export function mineDatasourceObsPropsFromDS(dsId: string): { ds: any; observedProps: any } {
	const dataStreamStore = useDataStreamStore();
	const ds = dataStreamStore.getDataStreamsById([dsId])[0];

	if (!ds) {
		console.warn('No datastream given');
	}

	const observedProps = ds.datastream.properties?.observedProperties || [];

	return { ds, observedProps };
}

export async function fetchDsSchema(datastream: any): Promise<any> {
	let checkedFormat = datastream.properties.formats.filter(
		(format: any) =>
			format.includes('application/swe+json') || format.includes('application/swe+binary')
	);

	if (!checkedFormat) {
		checkedFormat = ['application/om+json']; // Fallback to om+json which should be available always
	}

	let filter = new DataStreamFilter({ obsFormat: checkedFormat[0] });
	return datastream
		.getSchema(filter)
		.then((schemaRes: any) => {
			if (schemaRes) {
				return schemaRes;
			}
		})
		.catch((error: any) => {
			console.error('[fetchDsSchema] Error fetching schema:', error);
			return null;
		});
}

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
 * Connects SweApi datasources
 *
 * @param dsInstances
 */
export function connectDatasources(dsInstances: Ref<SweApi[]>) {
	const raw = dsInstances.value;

	const dsList = Array.isArray(raw) ? raw : raw ? [raw] : [];
	for (const ds of dsList) {
		ds.connect();
	}
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
