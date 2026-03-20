import { useUIStore } from '@/stores/uistore';
import DataStreamFilter from 'osh-js/source/core/sweapi/datastream/DataStreamFilter';
import ControlFilter from 'osh-js/source/core/sweapi/control/ControlFilter';
import { useDataStreamStore } from '@/stores/datastreamstore'
import {useControlStreamStore} from "@/stores/controlstreamstore";

export function mineDatasourceObsProps(): { ds: any; observedProps: any } {
	const uiStore = useUIStore();
	const ds = uiStore.selectedDatastream;

	if (!ds) {
		console.warn('[DS-Utils] No datastream selected');
	}

	const observedProps = ds.datastream.properties?.observedProperties || [];
	console.log('[DS-Utils] Observed Properties:', ds.datastream.properties);

	// fetchSchema(ds.datastream);

	return { ds, observedProps };
}

/**
 * FOR NEW VISUALIZATION WIZARD
 * Takes datasource ID as parameter
 * @returns 
 */
export function mineDatasourceObsPropsFromDS(dsId: string): { ds: any; observedProps: any } {
  const dataStreamStore = useDataStreamStore()
  const ds = dataStreamStore.getDataStreamsById([dsId])[0]

  if (!ds) {
    console.warn('No datastream given')
  }

	const observedProps = ds.datastream.properties?.observedProperties || [];
	console.log('[DS-Utils] Observed Properties:', ds.datastream.properties);

	// fetchSchema(ds.datastream);

	return { ds, observedProps };
}

export function mineControlObsPropsFromCS(csID: string): { cs: any; controlledProperties: any } {
	const controlStreamStore = useControlStreamStore();
	const cs = controlStreamStore.getControlStreamsById([csID])[0];

	if (!cs) {
		console.warn('No controlstream given');
	}

	const controlledProperties = cs.controlstream.properties.controlledProperties || [];
	console.log('[DS-Utils] Controlled Properties:', cs.controlstream.properties);

	return { cs, controlledProperties };
}

export function checkDSForProp(propName: string, observedProps: any): any {
	for (const prop of observedProps) {
		if (prop.definition.includes(propName)) {
			console.log(`[DS-Utils] Found property: ${propName}`);
			return prop;
		}
	}

	return false;
}

export function checkDSForProps(propNames: string[], observedProps: any): any {
	let results: any = {};

	for (const propName of propNames) {
		const res = checkDSForProp(propName, observedProps);
		if (res !== false) {
			results[propName] = res;
		}
	}

	if (Object.keys(results).length === 0) {
		return false;
	} else {
		return results;
	}
}

export async function fetchSchema(datastream: any): Promise<any> {
	console.log('[DatasourceUtils] Fetching schema for datastream:', datastream);

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
				console.log('[DatasourceUtils] Schema fetched:', schemaRes);
				return schemaRes;
			}
		})
		.catch((error: any) => {
			console.error('[DatasourceUtils] Error fetching schema:', error);
			return null;
		});
}

export async function fetchCsSchema(controlstream: any): Promise<any> {
    console.log('[DatasourceUtils] Fetching schema for controlstream:', controlstream);

    let checkedFormat = controlstream.properties.formats.filter(
        (format: any) =>
            format.includes('application/swe+json') || format.includes('application/swe+binary')
    );

    if (!checkedFormat) {
        checkedFormat = ['application/om+json']; // Fallback to om+json which should be available always
    }

    let filter = new ControlFilter({ format: 'application/json' });
    return controlstream
        .getSchema(filter)
        .then((schemaRes: any) => {
            if (schemaRes) {
                console.log('[DatasourceUtils] Schema fetched:', schemaRes);
                return schemaRes;
            }
        })
        .catch((error: any) => {
            console.error('[DatasourceUtils] Error fetching schema:', error);
            return null;
        });
}

export function matchPropAndSchema(observedProp: any, schema: any[]): any {
	let matchedProps: any = {};

	schema.filter((schemaEntry: any) => {
		if (schemaEntry.definition.includes(observedProp.definition)) {
			matchedProps[observedProp.definition] = {
				observedProperty: observedProp,
				schemaEntry: schemaEntry,
			};
			return schemaEntry;
		}
		return false;
	});

	return matchedProps;
}

export class VisualizationMetadata {
	id: string;
	type: string;
	datastreamId: string;
	observedProperty: string;

	constructor(id: string, type: string, datastreamId: string, observedProperty: string) {
		this.id = id;
		this.type = type;
		this.datastreamId = datastreamId;
		this.observedProperty = observedProperty;
	}
}

/**
 * Used to show a partial representation of a json Schema representation of the available fields in a datastream
 */
export class SchemaFieldProperty {
    definition: string;
    name: string;
    type: string;
    referenceFrame?: string;
    uom?: any;
    fields?: SchemaFieldProperty[];
    datastream_id?: string;
    controlstream_id?: string;
    label?: string;

    constructor(definition: string, name: string, type: string, unitOfMeasure?: string) {
        this.definition = definition;
        this.name = name;
        this.type = type;
        this.uom = unitOfMeasure;
        this.fields = [];
    }
}