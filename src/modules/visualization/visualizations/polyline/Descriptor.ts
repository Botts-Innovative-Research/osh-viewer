import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const PolylineConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'location',
		label: 'Location',
		description: 'The stream of locations that generate the polyline.',
		type: 'ds',
		required: true,
	},
	{
		role: 'polylineId',
		label: 'Polyline ID',
		description: 'Select the properties to distinguish multiple polylines.',
		type: 'ds',
		multiple: true,
	},
	{
		role: 'polylineColor',
		label: 'Color',
		description:
			'Polyline color will be generated dynamically based on the selected properties.',
		type: 'ds',
		multiple: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'polyline-config',
	label: 'Configure Polyline Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/polyline/Config.vue')
	),
	roles: PolylineConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'polyline-customize',
	label: 'Customize Polyline',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/polyline/Customize.vue')
	),
};

export const PolylineDescriptor: VisualizationDescriptor = {
	label: 'Polyline',
	id: 'polyline',
	icon: 'mdi-vector-polyline',
	viewLocation: 'map',
	layers: ['PolylineLayer'],
	description: 'Visualize a polyline on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/polyline/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium', 'leaflet'],
};
