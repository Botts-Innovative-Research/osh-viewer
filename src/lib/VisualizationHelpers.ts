import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';

export interface IVisualizationHelper {}

export interface DataSourceProperties {}

export interface ControlStreamProperties {}

export interface ISweApiDataSourceProperties extends DataSourceProperties {
  endpointUrl: string
  resource: string
  tls: boolean
  protocol: string
  startTime?: string
  endTime?: string
  mode: string
  responseFormat: string
    connectorOpts: { username: string, password: string}
  id?: string // ID to use for SweApi
  properties?: {
    // Role: property pair
    // Ex: "location": { property: "loc" }
    [key: string]: any
  }
}

export interface ISweApiControlStreamProperties extends ControlStreamProperties {
  endpointUrl: string
  tls: boolean
  protocol: string
  startTime?: string
  endTime?: string
  mode: string
  responseFormat: string
    connectorOpts: { username: string, password: string}
  id?: string // ID to use for SweApi
  properties?: {
    // Role: property pair
    // Ex: "location": { property: "loc" }
    [key: string]: any
  }
}

export interface DataLayerProperties {}

export interface DataViewProperties {}

export interface ICurveLayerProperties extends DataLayerProperties {
  maxValues: number
  dataSourceId: string
  getValues: (rec: any, timestamp: any) => { x: any; y: any }
  lineColor: string
  backgroundColor: string
  fill: boolean
  getCurveId?: (rec: any, timestamp: any) => string
  name: string
}

export class ChartHelper implements IVisualizationHelper {
	xAxisProperty: string;
	yAxisProperty: string;
	xAxisLabel: string;

	constructor(xAxisProperty: string, yAxisProperty: string, xAxisLabel: string) {
		this.xAxisProperty = xAxisProperty;
		this.yAxisProperty = yAxisProperty;
		this.xAxisLabel = xAxisLabel;
	}
}

export interface IChartViewProperties extends DataViewProperties {
  container: string
  layers: ICurveLayerProperties[]
  css: string
  datasetOptions?: any
  refreshRate?: number
}

export interface IVideoLayerProperties extends DataLayerProperties {
	dataSourceId: ISweApiDataSourceProperties;
	getFrameData: (rec: any, timestamp: any) => any;
	getTimestamp: (rec: any, timestamp: any) => any;
}

export interface IVideoViewProperties extends DataViewProperties {
	container: string;
	css: string;
	name: string;
	showTime: boolean;
	showStats: boolean;
	useWebCodecApi: boolean;
	width: number;
	height: number;
	layers: IVideoLayerProperties[];
	videoType: string;
}

export interface IPointMarkerLayerProperties extends DataLayerProperties {
	dataSourceId: string | string[];
	getLocation?: (rec: any) => { x: number; y: number; z: number };
	getOrientation?: (rec: any) => { heading: number };
	getCoordinates?: (rec: any) => { lat: number; lon: number };
	markerColor?: string;
	markerIcon?: string;
	name: string;
}

export interface IMapViewProperties extends DataViewProperties {
	container: string;
	layers: IPointMarkerLayerProperties[];
	css?: string;
	refreshRate?: number;
}

export class VisualizationComponents {
  dataLayer: DataLayerProperties | any | null // TODO: Fix type
  dataView: DataViewProperties | null
  dataSource: DataSourceProperties | DataSourceProperties[]
  controlstream?: ControlStreamProperties | ControlStreamProperties[] // Optional controlstream for visualizations like GeoPTZ

  constructor(datasource: SweApi | SweApi[], dataLayer: any, dataView: any, controlstream?: any) {
    this.dataSource = datasource
    this.dataLayer = dataLayer
    this.dataView = dataView
    this.controlstream = controlstream
  }
}

export class SweApiDataSourceProperties implements ISweApiDataSourceProperties {
  endpointUrl: string
  resource: string
  tls: boolean
  protocol: string
  startTime?: string
  endTime?: string
  mode: string
  responseFormat: string
  connectorOpts: { username: string, password: string }

  constructor(props: ISweApiDataSourceProperties) {
    this.endpointUrl = props.endpointUrl
    this.resource = props.resource
    this.tls = props.tls
    this.protocol = props.protocol
    this.startTime = props.startTime
    this.endTime = props.endTime
    this.mode = props.mode
    this.responseFormat = props.responseFormat
    this.connectorOpts = props.connectorOpts
  }
}

export class SweApiControlStreamProperties implements ISweApiControlStreamProperties {
  endpointUrl: string
  tls: boolean
  protocol: string
  startTime?: string
  endTime?: string
  mode: string
  responseFormat: string
  connectorOpts: { username: string, password: string }
  id: string

  constructor(props: ISweApiControlStreamProperties) {
    this.endpointUrl = props.endpointUrl
    this.tls = props.tls
    this.protocol = props.protocol
    this.startTime = props.startTime
    this.endTime = props.endTime
    this.mode = props.mode
    this.responseFormat = props.responseFormat
    this.connectorOpts = props.connectorOpts
    this.id = props.id ?? ''
  }
}

export class CurveLayerProperties implements ICurveLayerProperties {
  maxValues: number
  dataSourceId: string
  getValues: (rec: any, timestamp: any) => { x: any; y: any }
  lineColor: string
  backgroundColor: string
  fill: boolean
  getCurveId?: (rec: any, timestamp: any) => string
  name: string

  constructor(props: ICurveLayerProperties) {
    this.maxValues = props.maxValues
    this.dataSourceId = props.dataSourceId
    this.getValues = props.getValues
    this.lineColor = props.lineColor
    this.backgroundColor = props.backgroundColor
    this.fill = props.fill
    this.getCurveId = props.getCurveId
    this.name = props.name
  }
}

export class ChartViewProperties implements IChartViewProperties {
  container: string
  layers: ICurveLayerProperties[]
  css: string
  datasetOptions?: any
  refreshRate?: number

  constructor(props: IChartViewProperties) {
    this.container = props.container
    this.layers = props.layers
    this.css = props.css
    this.datasetOptions = props.datasetOptions
    this.refreshRate = props.refreshRate
  }
}

export class VideoLayerProperties implements IVideoLayerProperties {
  dataSourceId: SweApiDataSourceProperties
  getFrameData: (rec: any, timestamp: any) => any
  getTimestamp: (rec: any, timestamp: any) => any

  constructor(props: IVideoLayerProperties) {
    this.dataSourceId = props.dataSourceId
    this.getFrameData = props.getFrameData
    this.getTimestamp = props.getTimestamp
  }
}

export class VideoViewProperties implements DataViewProperties {
  container: string
  css: string
  name: string
  showTime: boolean
  showStats: boolean
  useWebCodecApi: boolean
  width: number
  height: number
  layers: VideoLayerProperties[]
  videoType: string

	constructor(props: IVideoViewProperties) {
		this.container = props.container;
		this.css = props.css;
		this.name = props.name;
		this.showTime = props.showTime;
		this.showStats = props.showStats;
		this.useWebCodecApi = props.useWebCodecApi;
		this.width = props.width;
		this.height = props.height;
		this.layers = props.layers.map((layer) => new VideoLayerProperties(layer));
		this.videoType = props.videoType;
	}
}

export class PointMarkerLayerProperties implements IPointMarkerLayerProperties {
	dataSourceId: string;
	getCoordinates: (rec: any) => { lat: number; lon: number };
	markerColor?: string;
	markerIcon?: string;
	name: string;

	constructor(props: IPointMarkerLayerProperties) {
		this.dataSourceId = props.dataSourceId;
		this.getCoordinates = props.getCoordinates;
		this.markerColor = props.markerColor;
		this.markerIcon = props.markerIcon;
		this.name = props.name;
	}
}

export class MapViewProperties implements IMapViewProperties {
	container: string;
	layers: IPointMarkerLayerProperties[];
	css?: string;
	refreshRate?: number;

  constructor(props: IMapViewProperties) {
    this.container = props.container
    this.layers = props.layers
    this.css = props.css
    this.refreshRate = props.refreshRate
  }
}
