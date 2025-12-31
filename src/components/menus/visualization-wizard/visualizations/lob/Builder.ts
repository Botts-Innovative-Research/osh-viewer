import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
	DataLayerProperties,
	DataViewProperties,
	ISweApiDataSourceProperties,
} from '@/lib/VisualizationHelpers';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { useVizWizStore } from '@/stores/vizwizstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { AggregateDatastreams, BuildRoleProperty } from '../../shared/helpers';
import { useDataStreamStore } from '@/stores/datastreamstore';

export function build() {
	console.log('Building LOB Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams();
	console.log(
		'Aggregated datastreams for LOB:',
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);

	const lobResult = CreateLobViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents = {
		dataSource: lobResult.vizDatasources,
		dataLayer: lobResult.lobLayer,
		dataView: lobResult.lobView,
	};

	// TODO: allow construction of visualization with visualization components and improve defaults
	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		'test',
		'lob',
		null,
		datastreams,
		null
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created Line of Bearing Visualization:', newViz);
}

/**
 * Creates properties for a Line of Bearing View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedLocationProperty
 * @param dsOptions
 * @constructor
 */
export function CreateLobViewProps(datastreams: { [key: string]: any }, visOptions: any) {
	const datastreamStore = useDataStreamStore();
	console.log('Datastreams: ', datastreamStore.dataStreams);

	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let lobLayer: any = {};

	// Iterate through each unique datastream ID
	for (const [dsId, entry] of Object.entries(datastreams)) {
		console.log('Processing datastream ID:', dsId, 'with entry:', entry);

		// Get selected properties for each role of the datastream
		const properties = BuildRoleProperty(entry);

		// Push new ISweApiDataSourceProperties
		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);
		const currentDataSource: ISweApiDataSourceProperties = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: randomUUID(),
			properties: properties,
		};
		vizDatasources.push(currentDataSource);
	}

	// Build remaining lobLayer properties
	lobLayer = {
		...lobLayer,
		color: visOptions.lineColor,
		weight: visOptions.weight,
		opacity: visOptions.opacity,
		distanceKm: visOptions.distanceKm,
		icon: visOptions.icon,
		iconSize: [32, 32],
		labelOffset: [-16, -32],
		label: `${randomUUID()} - PM Orientation Layer`,
		name: `${randomUUID()} - PM Orientation Layer`,
	};

	// Build MapViewProperties
	const lobView: ILineOfBearingViewProperties = {
		container: `map-container-${randomUUID()}`,
		layers: [lobLayer],
		css: 'map-view',
		refreshRate: 1000,
	};

	console.log('Created LOBViewProperties:', { vizDatasources, lobLayer, lobView });

	return {
		vizDatasources,
		lobLayer,
		lobView,
	};
}

export interface ILineOfBearingLayerProperties extends DataLayerProperties {
	dataSourceId: string;
	getOriginAndBearing: {
		dataSourceIds: string[];
		handler: (rec: any) => {
			origin: { x: number; y: number; z: number };
			bearing: number;
		};
	};
	getPolylineId?: (rec: any) => any;
	color: any;
	weight: number;
	opacity: number;
	distanceKm: number;
	name: string;
}

export class LineOfBearingLayerProperties implements ILineOfBearingLayerProperties {
	color: any;
	dataSourceId: string;
	distanceKm: number;

	// getOriginAndBearing(rec: any): {
	// 	origin: { x: number; y: number; z: number };
	// 	bearing: number;
	// } {
	// 	return { bearing: 0, origin: { x: 0, y: 0, z: 0 } };
	// }

	getOriginAndBearing: {
		dataSourceIds: string[];
		handler: (rec: any) => {
			origin: { x: number; y: number; z: number };
			bearing: number;
		};
	};

	name: string;
	opacity: number;
	weight: number;

	constructor(props: ILineOfBearingLayerProperties) {
		this.color = props.color;
		this.dataSourceId = props.dataSourceId;
		this.distanceKm = props.distanceKm;
		this.getOriginAndBearing = props.getOriginAndBearing;
		this.name = props.name;
		this.opacity = props.opacity;
		this.weight = props.weight;
	}
}

export interface ILineOfBearingViewProperties extends DataViewProperties {
	container: string;
	layers: ILineOfBearingLayerProperties[];
	css?: string;
	refreshRate?: number;
}

export class LobViewProperties implements DataViewProperties {
	container: string;
	layers: ILineOfBearingLayerProperties[];
	css?: string;
	refreshRate?: number;

	constructor(props: ILineOfBearingViewProperties) {
		this.container = props.container;
		this.layers = props.layers;
		this.css = props.css;
		this.refreshRate = props.refreshRate;
	}
}
