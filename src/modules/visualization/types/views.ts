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
}
