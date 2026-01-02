import { VisualizationCustomizationOptions } from './VisualizationCustomizationOptions';

export class LoBCustomizationOptions implements VisualizationCustomizationOptions {
	color: string;
	weight: number;
	opacity: number;
	distanceKm: number;

	constructor() {
		this.color = '#FF0000'; // Default color: Red
		this.weight = 5; // Default weight
		this.opacity = 0.8; // Default opacity
		this.distanceKm = 1; // Default distance in kilometers
	}
}
