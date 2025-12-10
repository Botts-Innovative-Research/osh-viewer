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

/**
 * Creates properties for a Line of Bearing View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedLocationProperty
 * @param dsOptions
 * @constructor
 */
export function CreateLobViewProps(
	ds: OSHDatastream,
	selectedLocationProperty: any,
	selectedBearingProperty: any,
	dsOptions: any,
	visOptions: any
): {
	dataSource: ISweApiDataSourceProperties;
	lobLayer: ILineOfBearingLayerProperties;
	lobView: ILineOfBearingViewProperties;
} {
	console.log('[DatasourceUtils] Creating Lob View for Datastream:', ds);
	const parentSystem = ds.getParentSystem();
	// Build SweApiDataSourceProperties
	const dataSource: ISweApiDataSourceProperties = {
		endpointUrl: ds.datastream.networkProperties.endpointUrl,
		resource: `/datastreams/${ds.datastream.properties.id}/observations`,
		tls: false,
		protocol: 'ws',
		startTime: dsOptions.startTime || 'now',
		endTime: dsOptions.endTime || '2125-08-01T00:00:00Z',
		mode: Mode.REAL_TIME,
		responseFormat: 'application/swe+json',
	};

	console.log('[DatasourceUtils] Creating LOB Layer for property:', selectedLocationProperty);
	console.log('[DatasourceUtils] Creating LOB Layer with visOptions:', visOptions);
	// Build MapLayerProperties
	const lobLayer: LineOfBearingLayerProperties = {
		dataSourceId: ds.datastream.properties.id,
		getOriginAndBearing: (rec: any) => {
			return {
				startLocation: {
					x: rec[selectedLocationProperty.name].lon,
					y: rec[selectedLocationProperty.name].lat,
					z: rec[selectedLocationProperty.name].alt || 0, // Default to 0 if altitude is not provided
				},
				bearing: (rec[selectedBearingProperty.name] * Math.PI) / 180,
			};
		},
		getPolylineId: (rec: any) => {
			return { frequency: rec[selectedLocationProperty.name].frequency };
		},
		color: visOptions.color,
		weight: visOptions.weight,
		opacity: visOptions.opacity,
		distanceKm: visOptions.distanceKm,
		name: parentSystem.name,
	};

	// Build MapViewProperties
	const lobView: ILineOfBearingViewProperties = {
		container: `map-container-${randomUUID()}`,
		layers: [lobLayer],
		css: 'map-view',
		refreshRate: 1000,
	};

	return {
		dataSource,
		lobLayer,
		lobView,
	};
}

export interface ILineOfBearingLayerProperties extends DataLayerProperties {
	dataSourceId: string;
	getOriginAndBearing: (rec: any) => {
		origin: { x: number; y: number; z: number };
		bearing: number;
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

	getOriginAndBearing(rec: any): {
		origin: { x: number; y: number; z: number };
		bearing: number;
	} {
		return { bearing: 0, origin: { x: 0, y: 0, z: 0 } };
	}

	name: string;
	opacity: number;
	weight: number;

	constructor(props: ILineOfBearingLayerProperties) {
		Object.assign(this, props);
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

export function build() {
	const vwStore = useVizWizStore();
	const datastreams = vwStore.datastreams;
	const vizStore = useVisualizationStore();

	const lobProps = CreateLobViewProps(
		datastreams[0],
		vwStore.dsConfig.locationProperty,
		vwStore.dsConfig.bearingProperty,
		vwStore.dsConfig,
		vwStore.visualizationCustomizationOptions
	);

	const visualizationComponents = {
		dataSource: lobProps.dataSource,
		dataLayer: lobProps.lobLayer,
		dataView: lobProps.lobView,
	};

	// TODO: allow construction of visualization with visualization components and improve defaults
	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		'test',
		'lob',
		null,
		[datastreams[0]],
		null
	);
	newViz.setVisualizationComponents(visualizationComponents);
	console.log('[LoB Viz Builder] Created Line of Bearing Visualization:', newViz);
	vizStore.addVisualization(newViz);
}
