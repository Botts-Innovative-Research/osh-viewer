/* VISUALIZATION COMPONENTS */

export type VisualizationLayerProperties =
	| DataLayerProperties
	| ICurveLayerProperties
	| IVideoLayerProperties
	| IPointMarkerLayerProperties
	| ILineOfBearingLayerProperties
	| IEllipseLayerProperties;
export type VisualizationViewProperties = IChartViewProperties | IVideoViewProperties;

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
	dataLayer: VisualizationLayerProperties | VisualizationLayerProperties[];
	dataView?: VisualizationViewProperties | VisualizationViewProperties[];
	controlstream?: ISweApiControlStreamProperties[]; // Optional controlstream for visualization
}

/* DATASOURCE PROPERTIES */

export interface ISweApiDataSourceProperties extends DataSourceProperties {
	resource: string;
}

/* CONTROLSTREAM PROPERTIES */

export interface ISweApiControlStreamProperties extends DataSourceProperties {}

/* CURVE LAYER */

export interface ICurveLayerProperties extends DataLayerProperties {
	maxValues: number;
	lineColor: string;
	backgroundColor: string;
	fill: boolean;
	xLabel: string;
	yLabel: string;
	// Use static curveId for serialization
	curveId: string;
	// Use static values mapping for serialization instead of getValues function
	values: {
		x: { outputName: string; property: string };
		y: { outputName: string; property: string };
	};
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
	label: string;
	icon: string;
	iconColor: string;
	iconName: string;
	iconSize: number[];
	labelOffset: number[];
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
	length: number;
	icon: string | null; // Allow null for optional icon
	iconColor: string;
	iconName: string;
	iconSize: number[];
	iconOpacity: number;
	labelOffset: number[];
	label: string;
}

/* ELLIPSE LAYER */
export interface IEllipseLayerProperties extends DataLayerProperties {
	getPosition?: (rec: any) => { x: number; y: number; z: number };
	getSemiMajorAxis?: (rec: any) => number;
	getSemiMinorAxis?: (rec: any) => number;
	color: any;
	iconName: string; // Used for display in map visualizations list
}

/* POLYLINE LAYER */
export interface IPolylineLayerProperties extends DataLayerProperties {
	getLocation?: (rec: any) => { x: number; y: number; z: number }[];
	getPolylineId?: (rec: any) => any;
	color: any;
	weight: number;
	opacity: number;
	iconName: string; // Used for display in map visualizations list
}

/**
 * Visualization Customization Options
 * Defines the set of customization options for different visualization types.
 */
export interface VisualizationCustomizationOptions {
	name: string;
}

export interface IPointMarkerCustomizationOptions extends VisualizationCustomizationOptions {
	icon: string;
	iconColor: string;
	iconName: string;
}

export interface ILineOfBearingCustomizationOptions extends VisualizationCustomizationOptions {
	icon: string | null; // Allow null for optional icon
	iconColor: string;
	iconName: string;
	showIcon: boolean;
	lobWeight: number;
	lobOpacity: number;
	lobDistanceKm: number;
	lineColor: string;
}

export interface IEllipseCustomizationOptions extends VisualizationCustomizationOptions {
	ellipseColor: string;
}

export interface IChartCustomizationOptions extends VisualizationCustomizationOptions {
	lineColor: string;
	backgroundColor: string;
}

export interface IVideoCustomizationOptions extends VisualizationCustomizationOptions {
	stats: boolean;
	time: boolean;
}

export interface IPolylineCustomizationOptions extends VisualizationCustomizationOptions {
	color: string;
	weight: number;
	opacity: number;
}
