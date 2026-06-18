import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const MissionConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'lla',
		label: 'Location',
		description: '',
		type: 'ds',
		required: true,
		showPropertySelector: false,
	},
	{
		role: 'home',
		label: 'Home Location',
		description: '',
		type: 'ds',
		required: true,
		showPropertySelector: false,
	},
	{
		role: 'plan',
		label: 'Mission Control Plan',
		description: '',
		type: 'cs',
		required: true,
		showPropertySelector: false,
	},
	// {
	// 	role: 'qgc',
	// 	label: 'Marker ID',
	// 	description: '',
	// 	type: 'cs',
	// 	required: true,
	//  showPropertySelector: false,
	// },
	{
		role: 'takeoff',
		label: 'Takeoff Control',
		description: '',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'land',
		label: 'Land Mission',
		description: '',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'pause',
		label: 'Pause Mission',
		description: '',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'rtl',
		label: 'Return to Launch',
		description: '',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'offboard',
		label: 'Offboard Control',
		description: '',
		type: 'cs',
		showPropertySelector: false,
	},
	// {
	// 	role: 'cancel',
	// 	label: 'Cancel Mission',
	// 	description: '',
	// 	type: 'cs',
	// 	showPropertySelector: false,
	// },
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'mission-config',
	label: 'Configure Mission Builder Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/mission/Config.vue')
	),
	roles: MissionConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'mission-customize',
	label: 'Customize Mission Builder',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/mission/Customize.vue')
	),
};

export const MissionDescriptor: VisualizationDescriptor = {
	label: 'Mission Builder',
	id: 'mission',
	icon: 'mdi-airplane-plus',
	viewLocation: 'multi',
	layers: ['PointMarkerLayer', 'PolylineLayer'],
	description: 'Create and manage missions for a drone.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/mission/Builder'),
	supportsCs: true, // This visualization requires a controlstream to function
	requireCs: true, // This visualization requires a controlstream to function
	supportedMaps: ['cesium', 'leaflet'],
};
