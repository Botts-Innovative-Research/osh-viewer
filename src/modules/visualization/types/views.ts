import { DataLayerProperties, ICurveLayerProperties, IVideoLayerProperties } from './layers';

export interface DataViewProperties {
	container: string;
	css: string;
	layers: DataLayerProperties[] | null;
}

export interface IChartViewProperties extends DataViewProperties {
	layers: ICurveLayerProperties[];
	datasetOptions?: any;
	refreshRate?: number;
}

export interface IVideoViewProperties extends DataViewProperties {
	layers: IVideoLayerProperties[];
	showTime: boolean;
	showStats: boolean;
	useWebCodecApi: boolean;
	width: number;
	height: number;
	props360?: {
		projection: string;
		fisheyeFovDeg: number;
	};
}

export interface ISdrViewProperties extends DataViewProperties {
	autoDb?: boolean;
	minDb?: number;
	maxDb?: number;
	waterfall?: boolean;
	waterfallSpeed?: number;
	averaging?: number;
	colorPalette?: string;
}

