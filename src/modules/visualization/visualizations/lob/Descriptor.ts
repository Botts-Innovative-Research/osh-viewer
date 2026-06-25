import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const LobConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'origin',
		label: 'Origin',
		description: 'The geographical starting location of the LoB.',
		type: 'ds',
		required: true,
	},
	{
		role: 'bearing',
		label: 'Bearing',
		description: 'The bearing direction of the LoB.',
		type: 'ds',
		required: true,
	},
	{
		role: 'lobId',
		label: 'LoB ID',
		description: 'Select the properties to distinguish multiple LoBs.',
		type: 'ds',
		multiple: true,
	},
	{
		role: 'lobIconColor',
		label: 'Icon Color',
		description: 'Icon color will be generated dynamically based on the selected properties.',
		type: 'ds',
		multiple: true,
	},
	{
		role: 'lobLineColor',
		label: 'Line Color',
		description: 'Line color will be generated dynamically based on the selected properties.',
		type: 'ds',
		multiple: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'lob-config',
	label: 'Configure Line of Bearing Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/lob/Config.vue')
	),
	roles: LobConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'lob-customize',
	label: 'Customize Line of Bearing',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/lob/Customize.vue')
	),
};

export const LobDescriptor: VisualizationDescriptor = {
	label: 'Line of Bearing',
	id: 'lob',
	icon: 'mdi-ray-start',
	viewLocation: 'map',
	layers: ['LoB'],
	description: 'Visualize a point marker with a line indicating the line of bearing (LOB).',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/lob/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium', 'leaflet'],
};
