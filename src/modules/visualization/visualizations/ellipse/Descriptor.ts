import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const EllipseConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'position',
		label: 'Location',
		description: 'The geographical center of the ellipse.',
		type: 'ds',
		required: true,
	},
	{
		role: 'semiMajorAxis',
		label: 'Semi-Major Axis',
		description: `Select the property that specifies the length of the ellipse's semi-major axis.`,
		type: 'ds',
		required: true,
	},
	{
		role: 'semiMinorAxis',
		label: 'Semi-Minor Axis',
		description: `Select the property that specifies the length of the ellipse's semi-minor axis.`,
		type: 'ds',
		required: true,
	},
	{
		role: 'ellipseId',
		label: 'Ellipse ID',
		description: 'Select the properties to distinguish multiple ellipses.',
		type: 'ds',
		multiple: true,
	},
	{
		role: 'ellipseColor',
		label: 'Color',
		description:
			'Ellipse color will be generated dynamically based on the selected properties.',
		type: 'ds',
		multiple: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'ellipse-config',
	label: 'Configure Ellipse Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/ellipse/Config.vue')
	),
	roles: EllipseConfigRoles,
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
	layers: ['EllipseLayer'],
	description: 'Visualize an ellipse on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/ellipse/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium'],
};
