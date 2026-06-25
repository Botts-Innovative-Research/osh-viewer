import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const TextConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'stream',
		label: 'Stream',
		description: 'The datastream to display data from.',
		type: 'ds',
		required: true,
		multiple: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'text-config',
	label: 'Configure Text Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/text/Config.vue')
	),
	roles: TextConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'text-customize',
	label: 'Customize Text',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/text/Customize.vue')
	),
};

export const TextDescriptor: VisualizationDescriptor = {
	label: 'Text',
	id: 'text',
	icon: 'mdi-format-text',
	viewLocation: 'panel',
	layers: [],
	description: 'Display selected properties from a datastream.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/text/Builder'),
	supportsCs: false,
	requireCs: false,
};
