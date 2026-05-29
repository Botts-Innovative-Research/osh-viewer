import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';

export const ConfigComponent: VisualizationFormComponent = {
	id: 'polyline-config',
	label: 'Configure Polyline Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/polyline/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'polyline-customize',
	label: 'Customize Polyline',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/polyline/Customize.vue')
	),
};

export const PolylineDescriptor: VisualizationDescriptor = {
	label: 'Polyline',
	id: 'polyline',
	icon: 'mdi-vector-polyline',
	viewLocation: 'map',
	description: 'Visualize a polyline on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/polyline/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium', 'leaflet'],
};
