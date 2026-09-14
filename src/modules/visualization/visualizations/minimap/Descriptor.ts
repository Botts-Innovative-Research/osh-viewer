import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';
import { MissionConfigRoles } from '@/modules/visualization/visualizations/mission/Descriptor';

export const MiniMapConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'location',
		label: 'Location',
		description: 'Select the data stream for the vehicle\'s live position.',
		type: 'ds',
		required: true,
		showPropertySelector: true,
	},
	{
		role: 'orientation',
		label: 'Orientation/ Attitude',
		description: 'Select the data stream for the direction of the vehicle\'s facing',
		type: 'ds',
		required: false,
		showPropertySelector: true,
	},
	{
		role: 'video',
		label: 'Video',
		description: 'Select the data stream for the video overlay',
		type: 'ds',
		required: false,
		showPropertySelector: true,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'minimap-config',
	label: 'Configure Mini Map Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/minimap/Config.vue')
	),
	roles: MiniMapConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'minimap-customize',
	label: 'Customize Mini Map',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/minimap/Customize.vue')
	),
};

export const MiniMapDescriptor: VisualizationDescriptor = {
	label: 'Mini Map',
	id: 'minimap',
	icon: 'mdi-map',
	viewLocation: 'multi',
	layers: ['VideoDataLayer', 'PointMarkerLayer', 'PolylineLayer'],
	description: 'A mini Cesium map view that can toggle between platform, follow and overhead views.',
	formComponents: [
		ConfigComponent,
		CustomizeComponent
	],
	builder: () => import('@/modules/visualization/visualizations/minimap/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium'],
};
