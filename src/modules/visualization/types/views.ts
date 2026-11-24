import {
	DataLayerProperties,
	ICurveLayerProperties,
	ISdrLayerProperties,
	IVideoLayerProperties,
} from './layers';

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
	layers: ISdrLayerProperties[] | null;
	autoDb?: boolean;
	minDb?: number;
	maxDb?: number;
	waterfall?: boolean;
	waterfallSpeed?: number;
	averaging?: number;
	colorPalette?: string;
	// Frequency plan used until the data reports the one it was recorded with
	centerFrequency?: number;
	sampleRate?: number;
	// The command set of the receiver and, for an HTL radio, the connection it is reached by
	receiverType?: 'rtlsdr' | 'htl';
	connectionMode?: '1GbE' | '10GbE' | 'BOTH' | 'UNKNOWN';
	showAudioControls?: boolean;
	showReceiverControls?: boolean;
	volume?: number;
	squelch?: number;
}

