/**
 * Customization Options
 * Defines the set of customization options for different visualization types.
 */
export interface CustomizationOptions {
	name: string;
}

export interface IPointMarkerCustomizationOptions extends CustomizationOptions {
	icon: string;
	iconColor: string;
	iconName: string;
}

export interface ILineOfBearingCustomizationOptions extends CustomizationOptions {
	icon: string | null; // Allow null for optional icon
	iconColor: string;
	iconName: string;
	showIcon: boolean;
	lobWeight: number;
	lobOpacity: number;
	lobDistanceKm: number;
	lineColor: string;
}

export interface IEllipseCustomizationOptions extends CustomizationOptions {
	ellipseColor: string;
}

export interface IChartCustomizationOptions extends CustomizationOptions {
	lineColor: string;
	backgroundColor: string;
}

export interface IVideoCustomizationOptions extends CustomizationOptions {
	stats: boolean;
	time: boolean;
}

export interface IPolylineCustomizationOptions extends CustomizationOptions {
	color: string;
	weight: number;
	opacity: number;
}

export interface IFrustumCustomizationOptions extends CustomizationOptions {
	color: string;
	opacity: number;
}
