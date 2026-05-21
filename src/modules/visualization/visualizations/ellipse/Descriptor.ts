import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';

export const ConfigComponent: VisualizationFormComponent = {
	id: 'ellipse-config',
	label: 'Configure Ellipse Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/ellipse/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'ellipse-customize',
	label: 'Customize Ellipse',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/ellipse/Customize.vue')
	),
};

export const EllipseDescriptor: VisualizationDescriptor = {
	label: 'Ellipse',
	id: 'ellipse',
	icon: 'mdi-ellipse-outline',
	viewLocation: 'map',
	description: 'Visualize an ellipse on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/ellipse/Builder'),
	supportedMaps: ['cesium'],
};
