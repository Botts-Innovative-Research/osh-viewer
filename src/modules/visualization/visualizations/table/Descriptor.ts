import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const TableConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'column',
		label: 'Column',
		description: '',
		type: 'ds',
		required: true,
		multiple: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'table-config',
	label: 'Configure Table Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/table/Config.vue')
	),
	roles: TableConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'table-customize',
	label: 'Customize Table',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/table/Customize.vue')
	),
};

export const TableDescriptor: VisualizationDescriptor = {
	label: 'Table',
	id: 'table',
	icon: 'mdi-table',
	viewLocation: 'panel',
	layers: [],
	description: 'Display selected properties from a datastream.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/table/Builder'),
	supportsCs: false,
	requireCs: false,
};
