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
