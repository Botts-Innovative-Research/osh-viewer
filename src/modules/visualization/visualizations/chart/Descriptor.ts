import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const ChartConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'x',
		label: 'X Axis',
		description: 'Select the property to define the x-axis of the chart (e.g. time)',
		type: 'ds',
		required: true,
	},
	{
		role: 'y',
		label: 'Y Axis',
		description: 'Select properties to display on the y-axis, each as a separate line.',
		type: 'ds',
		required: true,
		multiple: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'chart-config',
	label: 'Configure Chart Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/chart/Config.vue')
	),
	roles: ChartConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'chart-customize',
	label: 'Customize Chart',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/chart/Customize.vue')
	),
};

export const ChartDescriptor: VisualizationDescriptor = {
	label: 'Chart',
	id: 'chart',
	icon: 'mdi-chart-line',
	viewLocation: 'panel',
	layers: ['CurveLayer'],
	description: 'Visualize data as a chart.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/chart/Builder'),
	supportsCs: false,
	requireCs: false,
};
