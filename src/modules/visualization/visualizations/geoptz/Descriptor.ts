import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const GeoPtzConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'lla',
		label: 'GeoPTZ Control',
		description: 'Select the controlstream for the LLA-to-PTZ process.',
		type: 'cs',
		required: true,
		showPropertySelector: false,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'geoPtz-config',
	label: 'Configure GeoPTZ Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/geoptz/Config.vue')
	),
	roles: GeoPtzConfigRoles,
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
	layers: ['PointMarkerLayer'],
	description: 'Task supported sensors with LLA coordinates.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/geoptz/Builder'),
	supportsDs: false,
	requireDs: false,
	supportsCs: true, // This visualization requires a controlstream to function
	requireCs: true, // This visualization requires a controlstream to function
	supportedMaps: ['cesium', 'leaflet'],
};

// Define GeoPTZ command structure
export interface GeoPTZCommand {
	parameters: {
		lat: number;
		lon: number;
		alt: number;
	};
}
