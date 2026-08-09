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
	// {
	// 	role: 'platformOrientation',
	// 	label: 'Platform Orientation',
	// 	description: 'The platform orientation (heading, pitch, roll) of the frustum.',
	// 	type: 'ds',
	// 	required: true,
	// },
	{
		role: 'sensorOrientation',
		label: 'Sensor Orientation',
		description: 'The sensor orientation (yaw, pitch, roll) of the frustum.',
		type: 'ds',
		required: true,
	},
	{
		role: 'range',
		label: 'Range',
		description: 'Dynamic range (distance) of the frustum from datastream.',
		type: 'ds',
		required: false,
	},
	{
		role: 'horizontalFOV',
		label: 'Horizontal FOV',
		description: 'Dynamic horizontal field of view from datastream.',
		type: 'ds',
		required: false,
	},
	// {
	// 	role: 'verticalFOV',
	// 	label: 'Vertical FOV',
	// 	description: 'Dynamic vertical field of view from datastream (3D frustum only).',
	// 	type: 'ds',
	// 	required: false,
	// },
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
