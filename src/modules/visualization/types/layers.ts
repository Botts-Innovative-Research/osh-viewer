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

export interface IEllipseLayerProperties extends DataLayerProperties {
	getPosition?: (rec: any) => { x: number; y: number; z: number };
	getSemiMajorAxis?: (rec: any) => number;
	getSemiMinorAxis?: (rec: any) => number;
	color: any;
	iconName: string; // Used for display in map visualizations list
}

export interface IPolylineLayerProperties extends DataLayerProperties {
	getLocation?: (rec: any) => { x: number; y: number; z: number }[];
	getPolylineId?: (rec: any) => any;
	color: any;
	weight: number;
	opacity: number;
	iconName: string; // Used for display in map visualizations list
}
