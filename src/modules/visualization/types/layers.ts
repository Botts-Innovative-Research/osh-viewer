import { ICON_OPTIONS, iconPathBuilder } from '@/lib/icons';

export interface DataLayerProperties {
	name: string;
}

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

export interface IVideoLayerProperties extends DataLayerProperties {
	getFrameData: (rec: any, timestamp: any) => any;
	getTimestamp: (rec: any, timestamp: any) => any;
}

export interface IPointMarkerLayerProperties extends DataLayerProperties {
	getCoordinates?: (rec: any) => { lat: number; lon: number };
	label: string;
	icon: string;
	iconColor: string;
	iconName: string;
	iconSize: number[];
	iconAnchor: number[];
	labelOffset: number[];
}

// Default PointMarkerLayerProperties with default values for a new point marker layer
export const DEFAULT_POINTMARKER_LAYER_PROPERTIES: IPointMarkerLayerProperties = {
	name: 'New PointMarker',
	label: '',
	icon: iconPathBuilder(ICON_OPTIONS[0].category, ICON_OPTIONS[0].icon),
	iconColor: '#FF0000',
	iconName: ICON_OPTIONS[0].icon,
	iconSize: [32, 32],
	iconAnchor: [16, 16],
	labelOffset: [0, -48],
};

export interface ILineOfBearingLayerProperties extends DataLayerProperties {
	color: any;
	weight: number;
	opacity: number;
	length: number;
	iconName: string; // Used for display in map visualizations list
	label: string;
}

export interface IEllipseLayerProperties extends DataLayerProperties {
	color: any;
	iconName: string; // Used for display in map visualizations list
}

export interface IPolylineLayerProperties extends DataLayerProperties {
	color: any;
	weight: number;
	opacity: number;
	iconName: string; // Used for display in map visualizations list
	maxPoints: number;
}

export interface IFrustumLayerProperties extends DataLayerProperties {
	color: any;
	borderColor: any;
	opacity: number;
	fov: number;
	range: number;
	aspectRatio: number;
	iconName: string; // Used for display in map visualizations list
}
