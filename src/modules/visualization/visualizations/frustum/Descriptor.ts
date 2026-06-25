import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const FrustumConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'origin',
		label: 'Origin',
		description: 'The geographical starting location of the frustum.',
		type: 'ds',
		required: true,
	},
	{
		role: 'orientation',
		label: 'Orientation',
		description: 'The orientation (heading, pitch, roll) of the frustum.',
		type: 'ds',
		required: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'frustum-config',
	label: 'Configure Frustum Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/frustum/Config.vue')
	),
	roles: FrustumConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'frustum-customize',
	label: 'Customize Frustum',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/frustum/Customize.vue')
	),
};

export const FrustumDescriptor: VisualizationDescriptor = {
	label: 'Frustum',
	id: 'frustum',
	icon: 'mdi-pyramid',
	viewLocation: 'map',
	layers: ['FrustumLayer'],
	description: 'Visualize a frustum on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/frustum/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium'],
};
