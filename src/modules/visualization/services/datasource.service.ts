import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import DataStream from 'osh-js/source/core/consysapi/datastream/DataStream.js';
import ObservationFilter from 'osh-js/source/core/consysapi/observation/ObservationFilter.js';
import { Ref } from 'vue';
import { IConSysApiDataSourceProperties } from '../types/datasource';
import { useDataStreamStore } from '@/stores/datastreamstore';
import DataStreamFilter from 'osh-js/source/core/consysapi/datastream/DataStreamFilter';

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
	if (!datastream || !datastream.properties) return null;
	const formats: string[] = datastream.properties.formats || [];
	let checkedFormat = formats.filter(
		(format: any) =>
			format.includes('application/swe+json') || format.includes('application/swe+binary')
	);

	if (!checkedFormat || checkedFormat.length === 0) {
		checkedFormat = formats.filter((format: any) => format.includes('application/om+json'));
	}

	if (!checkedFormat || checkedFormat.length === 0) {
		checkedFormat = ['application/om+json']; // Fallback to om+json which should be available always
	}

	let filter = new DataStreamFilter({ obsFormat: checkedFormat[0] });
	return datastream
		.getSchema(filter)
		.then((schemaRes: any) => {
			if (schemaRes) {
				return schemaRes;
			}
			return null;
		})
		.catch((error: any) => {
			console.error('[fetchDsSchema] Error fetching schema:', error);
			return null;
		});
}

/**
 * Create a ConSysApi datasource from given datasource properties
 *
 * @param dsProps - Array of datasource properties to create ConSysApi object
 * @returns Generated ConSysApi datasource instance
 */
export function createDatasource(dsProps: IConSysApiDataSourceProperties) {
	const dsInstance = new ConSysApi(dsProps.id, {
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
 * Connects ConSysApi datasources
 *
 * @param dsInstances
 */
export function connectDatasources(dsInstances: Ref<(typeof ConSysApi)[]>) {
	const raw = dsInstances.value;

	const dsList = Array.isArray(raw) ? raw : raw ? [raw] : [];
	for (const ds of dsList) {
		ds.connect();
	}
}

/**
 * Disconnects ConSysApi datasources
 *
 * @param dsInstances
 */
export function disconnectDatasources(dsInstances: Ref<(typeof ConSysApi)[]>) {
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
	datastreamId?: string;
	resource?: string;
	endpointUrl: string;
	tls: boolean;
	connectorOpts?: { username: string; password: string };
}): Promise<any | null> => {
	const resourceMatch = (dsProps.resource || '').match(/\/datastreams\/([^/?#]+)/);
	const streamId = dsProps.datastreamId || (resourceMatch ? resourceMatch[1] : dsProps.id);
	const user = dsProps.connectorOpts?.username || 'admin';
	const pass = dsProps.connectorOpts?.password || 'test';
	const httpProto = dsProps.tls ? 'https' : 'http';
	let cleanEndpoint = (dsProps.endpointUrl || '')
		.replace(/^https?:\/\//, '')
		.replace(/^wss?:\/\//, '')
		.replace(/\/datastreams.*$/, '')
		.replace(/\/+$/, '');

	// 1. Direct authenticated fetch for speed and robust credentials
	const candidateUrls = [
		`${httpProto}://${cleanEndpoint}/datastreams/${streamId}/observations?resultTime=latest&format=application/om%2Bjson&limit=5`,
		`/sensorhub/api/datastreams/${streamId}/observations?resultTime=latest&format=application/om%2Bjson&limit=5`,
	];

	for (const authUrl of candidateUrls) {
		try {
			const res = await fetch(authUrl, {
				method: 'GET',
				headers: {
					Authorization: 'Basic ' + btoa(`${user}:${pass}`),
				},
				credentials: 'include',
			});
			if (res.ok) {
				const json = await res.json();
				const items: any[] = Array.isArray(json) ? json : (json.items || []);
				if (items.length > 0) {
					const lastItem = items[items.length - 1];
					return lastItem.data ?? lastItem.result ?? lastItem;
				}
			}
		} catch (_) {}
	}


	// 2. DataStream searchObservations fallback
	try {
		const networkProperties = {
			endpointUrl: dsProps.endpointUrl,
			tls: dsProps.tls,
			connectorOpts: dsProps.connectorOpts ?? { username: user, password: pass },
		};

		const datastream = new DataStream({ id: streamId }, networkProperties);
		const results = await datastream.searchObservations(
			new ObservationFilter({ resultTime: 'latest' }),
			10
		);

		if (!results) return null;
		const obsResult = await results.nextPage();
		if (obsResult && obsResult.length > 0) {
			const last = obsResult[obsResult.length - 1];
			return last.data ?? last.result ?? last;
		}
		return null;
	} catch (e) {
		console.warn('[getLatestObservation] Warning fetching latest observation:', e);
		return null;
	}
};

