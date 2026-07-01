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
}

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
}
