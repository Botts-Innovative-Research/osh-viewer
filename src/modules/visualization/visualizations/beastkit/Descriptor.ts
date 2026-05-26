import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';

export const ConfigComponentPointMarker: VisualizationFormComponent = {
	id: 'beastkit-config-pointmarker',
	label: 'Configure Beastkit Properties: Point Marker',
	short: 'Point Marker',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/pointmarker/Config.vue')
	),
};
export const ConfigComponentLob: VisualizationFormComponent = {
	id: 'beastkit-config-lob',
	label: 'Configure Beastkit Properties: Line of Bearing',
	short: 'LoB',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/lob/Config.vue')
	),
};
export const ConfigComponentEllipse: VisualizationFormComponent = {
	id: 'beastkit-config-ellipse',
	label: 'Configure Beastkit Properties: Ellipse',
	short: 'Ellipse',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/ellipse/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'beastkit-customize',
	label: 'Customize Beastkit',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/beastkit/Customize.vue')
	),
};

export const BeastkitDescriptor: VisualizationDescriptor = {
	label: 'Beastkit',
	id: 'beastkit',
	icon: 'mdi-star-box-outline',
	viewLocation: 'map',
	description: 'Visualize Beastkit sensor on the map.',
	formComponents: [
		ConfigComponentPointMarker,
		ConfigComponentLob,
		ConfigComponentEllipse,
		CustomizeComponent,
	],
	builder: () => import('@/modules/visualization/visualizations/beastkit/Builder'),
	supportedMaps: ['cesium'],
};
