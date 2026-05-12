import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';

export const ConfigComponent: VisualizationFormComponent = {
	id: 'geoPtz-config',
	label: 'Configure GeoPTZ Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/geoptz/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'geoPtz-customize',
	label: 'Customize GeoPTZ',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/geoptz/Customize.vue')
	),
};

export const GeoPtzDescriptor: VisualizationDescriptor = {
	label: 'GeoPTZ',
	id: 'geoPtz',
	icon: 'mdi-map',
	viewLocation: 'multi',
	description: 'Task supported sensors with LLA coordinates.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/geoptz/Builder'),
	requireCs: true, // This visualization requires a controlstream to function
};

// Define GeoPTZ command structure
export interface GeoPTZCommand {
	parameters: {
		lat: number;
		lon: number;
		alt: number;
	};
}
