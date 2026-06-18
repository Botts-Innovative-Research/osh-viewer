import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';

export const ConfigComponent: VisualizationFormComponent = {
	id: 'minimap-config',
	label: 'Configure Mini Map Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/minimap/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'minimap-customize',
	label: 'Customize Mini Map',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/minimap/Customize.vue')
	),
};

export const MiniMapDescriptor: VisualizationDescriptor = {
	label: 'Mini Map',
	id: 'minimap',
	icon: 'mdi-map',
	viewLocation: 'multi',
	layers: [],
	description: 'A mini Cesium map view that can toggle between platform, follow and overhead views.',
	formComponents: [
		ConfigComponent,
		CustomizeComponent
	],
	builder: () => import('@/modules/visualization/visualizations/minimap/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium'],
};
