/* VISUALIZATION COMPONENTS */

export interface DataSourceProperties {
  endpointUrl: string
  tls: boolean
  protocol: string
  startTime?: string
  endTime?: string
  mode: string
  responseFormat: string
  connectorOpts: { username: string, password: string}
  id: string // ID to use for SweApi
  properties: {
    // Role: property pair
    // Ex: "location": { property: "loc" }
    [key: string]: any
  }
}
export interface DataLayerProperties {
  name: string
}
export interface DataViewProperties {
  container: string
  css: string
  layers: DataLayerProperties[] | null
}

export interface VisualizationComponents {
  dataSource: ISweApiDataSourceProperties[]
  dataLayer: DataLayerProperties | null
  dataView: DataViewProperties | null
  controlstream?: ISweApiControlStreamProperties[] // Optional controlstream for visualization
}

/**
 * Visualization Customization Options
 * Defines the set of customization options for different visualization types.
 */
export interface VisualizationCustomizationOptions {}


/* DATASOURCE PROPERTIES */

export interface ISweApiDataSourceProperties extends DataSourceProperties {
  resource: string
}

/* CONTROLSTREAM PROPERTIES */

export interface ISweApiControlStreamProperties extends DataSourceProperties {}

/* CURVE LAYER */

export interface ICurveLayerProperties extends DataLayerProperties {
  maxValues: number
  getValues: (rec: any, timestamp: any) => { x: any; y: any }
  lineColor: string
  backgroundColor: string
  fill: boolean
  getCurveId: (rec: any, timestamp: any) => string
  xLabel: string
  yLabel: string
}

/* CHART */

export interface IChartViewProperties extends DataViewProperties {
  layers: ICurveLayerProperties[]
  datasetOptions?: any
  refreshRate?: number
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
	videoType: string;
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
  iconSize: number[]
  labelOffset: number[]
}

/* MAP VIEW */

export interface IMapViewProperties extends DataViewProperties {
	layers: IPointMarkerLayerProperties[];
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

export class LineOfBearingLayerProperties implements ILineOfBearingLayerProperties {
	color: any;
	distanceKm: number;
	getOriginAndBearing?: {
		dataSourceIds: string[];
		handler: (rec: any) => {
			origin: { x: number; y: number; z: number };
			bearing: number;
		};
	};
	name: string;
	opacity: number;
	weight: number;
  icon: string;
  iconName: string;
  iconSize: number[];
  labelOffset: number[];
  label: string;

	constructor(props: ILineOfBearingLayerProperties) {
		this.color = props.color;
		this.distanceKm = props.distanceKm;
		this.getOriginAndBearing = props.getOriginAndBearing;
		this.name = props.name;
		this.opacity = props.opacity;
		this.weight = props.weight;
    this.icon = props.icon
    this.iconName = props.iconName
    this.iconSize = props.iconSize
    this.labelOffset = props.labelOffset
    this.label = props.label
	}
}

export interface ILineOfBearingViewProperties extends DataViewProperties {
	layers: ILineOfBearingLayerProperties[];
	refreshRate?: number;
}

export class LobViewProperties implements DataViewProperties {
	container: string;
	layers: ILineOfBearingLayerProperties[];
	css: string;
	refreshRate?: number;

	constructor(props: ILineOfBearingViewProperties) {
		this.container = props.container;
		this.layers = props.layers;
		this.css = props.css;
		this.refreshRate = props.refreshRate;
	}
}
