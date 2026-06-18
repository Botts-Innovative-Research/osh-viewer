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
		description: 'Select the data stream for the vehicle\'s live position.',
		type: 'ds',
		required: true,
		showPropertySelector: false,
	},
	{
		role: 'home',
		label: 'Home Location',
		description: 'Select the data stream with the home/launch position used as the reference point for the mission.',
		type: 'ds',
		required: true,
		showPropertySelector: false,
	},
	{
		role: 'plan',
		label: 'Mission Control Plan',
		description: 'Select the control stream used to upload and run the mission on the vehicle.',
		type: 'cs',
		required: true,
		showPropertySelector: false,
	},
	{
		role: 'takeoff',
		label: 'Takeoff Control',
		description: 'Select the control stream that is used to tell the vehicle to take off into the air and starts the mission.',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'land',
		label: 'Land Mission',
		description: 'Select the control stream that lands the vehicle where its currently located.',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'pause',
		label: 'Pause Mission',
		description: 'Select the control stream that pauses the mission currently in progress.',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'rtl',
		label: 'Return to Launch',
		description: 'Select the control stream that sends the vehicle back to its home location.',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'offboard',
		label: 'Offboard Control',
		description: 'Select the control stream used to send offboard commands, letting an external system takeover control of the vehicle ',
		type: 'cs',
		showPropertySelector: false,
	},
	// {
	//     role: 'cancel',
	//     label: 'Cancel Mission',
	//     description: 'The control stream used to cancel the currently active mission.',
	//     type: 'cs',
	//     showPropertySelector: false,
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
