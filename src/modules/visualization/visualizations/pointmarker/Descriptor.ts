import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';

export const ConfigComponent: VisualizationFormComponent = {
	id: 'pointmarker-config',
	label: 'Configure Point Marker Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/pointmarker/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'pointmarker-customize',
	label: 'Customize Point Marker',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/pointmarker/Customize.vue')
	),
};

export const PointMarkerDescriptor: VisualizationDescriptor = {
	label: 'Point Marker',
	id: 'pointmarker',
	icon: 'mdi-map-marker',
	viewLocation: 'map',
	description: 'Visualize a point marker on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/pointmarker/Builder'),
};
