import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const TaskConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'stream-0',
		label: 'Stream',
		description: 'The controlstream to task from.',
		type: 'cs',
		required: true,
		multiple: true,
        showPropertySelector: false
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'task-config',
	label: 'Select Control Streams',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/task/Config.vue')
	),
	roles: TaskConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'task-customize',
	label: 'Customize Task',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/task/Customize.vue')
	),
};

export const TaskDescriptor: VisualizationDescriptor = {
	label: 'Task',
	id: 'task',
	icon: 'mdi-controller',
	viewLocation: 'panel',
	layers: [],
	description: 'Display selected properties from a controlstream.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/task/Builder'),
	supportsCs: true,
	requireCs: true,
	supportsDs: false,
	requireDs: false,
};
