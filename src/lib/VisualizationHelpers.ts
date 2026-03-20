/* VISUALIZATION COMPONENTS */

export type VisualizationLayerProperties =
	| DataLayerProperties
	| ICurveLayerProperties
	| IVideoLayerProperties
	| IPointMarkerLayerProperties
	| ILineOfBearingLayerProperties;
export type VisualizationViewProperties =
	| IChartViewProperties
	| IVideoViewProperties
	| IMapViewProperties;

export interface DataSourceProperties {
	endpointUrl: string;
	tls: boolean;
	protocol: string;
	startTime?: string;
	endTime?: string;
	mode: string;
	responseFormat: string;
	connectorOpts: { username: string; password: string };
	id: string; // ID to use for SweApi
	properties: {
		// Role: property pair
		// Ex: "location": { property: "loc" }
		[key: string]: any;
	};
}
export interface DataLayerProperties {
	name: string;
}
export interface DataViewProperties {
	container: string;
	css: string;
	layers: DataLayerProperties[] | null;
}

export interface VisualizationComponents {
	dataSource: ISweApiDataSourceProperties[];
	dataLayer: VisualizationLayerProperties | null;
	dataView: VisualizationViewProperties | null;
	controlstream?: ISweApiControlStreamProperties[]; // Optional controlstream for visualization
}

/**
 * Visualization Customization Options
 * Defines the set of customization options for different visualization types.
 */
export interface VisualizationCustomizationOptions {}

/* DATASOURCE PROPERTIES */

export interface ISweApiDataSourceProperties extends DataSourceProperties {
	resource: string;
}

/* CONTROLSTREAM PROPERTIES */

export interface ISweApiControlStreamProperties extends DataSourceProperties {}

/* CURVE LAYER */

export interface ICurveLayerProperties extends DataLayerProperties {
	maxValues: number;
	getValues: (rec: any, timestamp: any) => { x: any; y: any };
	lineColor: string;
	backgroundColor: string;
	fill: boolean;
	getCurveId: (rec: any, timestamp: any) => string;
	xLabel: string;
	yLabel: string;
}

/* CHART */

export interface IChartViewProperties extends DataViewProperties {
	layers: ICurveLayerProperties[];
	datasetOptions?: any;
	refreshRate?: number;
}

/* VIDEO */

export interface IVideoLayerProperties extends DataLayerProperties {
	getFrameData: (rec: any, timestamp: any) => any;
	getTimestamp: (rec: any, timestamp: any) => any;
}

export interface IVideoViewProperties extends DataViewProperties {
	layers: IVideoLayerProperties[];
	showTime: boolean;
	showStats: boolean;
	useWebCodecApi: boolean;
	width: number;
	height: number;
}

/* POINT MARKER */

export interface IPointMarkerLayerProperties extends DataLayerProperties {
	getLocation?: (rec: any) => { x: number; y: number; z: number };
	getOrientation?: (rec: any) => { heading: number };
	getCoordinates?: (rec: any) => { lat: number; lon: number };
	markerColor?: string;
	markerIcon?: string;
	label: string;
	icon: string;
	iconName: string;
	iconSize: number[];
	labelOffset: number[];
}

/* MAP VIEW */

export interface IMapViewProperties extends DataViewProperties {
	layers: IPointMarkerLayerProperties[] | ILineOfBearingLayerProperties[];
	refreshRate?: number;
}

/* LOB LAYER */

export interface ILineOfBearingLayerProperties extends DataLayerProperties {
	getOriginAndBearing?: {
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
	icon: string;
	iconName: string;
	iconSize: number[];
	labelOffset: number[];
	label: string;
}
