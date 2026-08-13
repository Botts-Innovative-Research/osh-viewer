import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';
import { MiniMapConfigRoles } from '@/modules/visualization/visualizations/minimap/Descriptor';

export const MissionConfigRoles: VisualizationConfigRole[] = [
    {
        role: 'status',
        label: 'Status',
        description: 'Select the data stream that outputs the systems status messages.',
        type: 'ds',
        required: true,
        showPropertySelector: false,
    },
	{
		role: 'plan',
		label: 'Mission Plan',
		description: 'Select the control stream used to upload and run a QGC mission.',
		type: 'cs',
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
	{
		role: 'arm',
		label: 'Arming Control',
		description: 'Select the control stream used to send',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'driveVelocity',
		label: 'Drive Velocity Control',
		description: 'Select the control stream used to send ',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'driveLocation',
		label: 'Drive to Location Control',
		description: 'Select the control stream used to send ground vehicles to location',
		type: 'cs',
		showPropertySelector: false,
	},
    {
        role: 'flyToLocation',
        label: 'Fly to Location Control',
        description: 'Select the control stream used to send UAS to specific location',
        type: 'cs',
        showPropertySelector: false,
    },
	{
		role: 'reboot',
		label: 'Reboot Control',
		description: 'Select the control stream used to send  ',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'hold',
		label: 'Hold Control',
		description: 'Select the control stream used to send  ',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'homePos',
		label: 'Home Position Control',
		description: 'Select the control stream used to send  ',
		type: 'cs',
		showPropertySelector: false,
	},
	{
		role: 'driveMode',
		label: 'Drive Mode Control',
		description: 'Select the control stream used to send  ',
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

export const HomePointMarkerConfigRoles: VisualizationConfigRole[] = [
    {
        role: 'homeLocation',
        label: 'Home Location',
        description: 'The geographical location of the point marker.',
        type: 'ds',
        required: true,
    },
    {
        role: 'orientation',
        label: 'Orientation',
        description: 'The heading direction of the point marker.',
        type: 'ds',
    },
    {
        role: 'markerId',
        label: 'Marker ID',
        description: 'Select the properties to distinguish multiple point markers.',
        type: 'ds',
        multiple: true,
    },
    {
        role: 'milSymbol',
        label: 'Military Symbology Icon',
        description: 'Select a property to apply a milsymbol icon for the point marker.',
        type: 'ds',
    },
    {
        role: 'pmIconColor',
        label: 'Icon Color',
        description: 'Icon color will be generated dynamically based on the selected properties.',
        type: 'ds',
        multiple: true,
    },
    {
        role: 'pmLabel',
        label: 'Icon Label',
        description: 'Select a property to appear as the point marker label.',
        type: 'ds',
    },
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'mission-config',
	label: 'Configure Mission Builder Properties',
	short: 'Mission',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/mission/Config.vue')
	),
	roles: MissionConfigRoles,
};

export const ConfigComponentMiniMap: VisualizationFormComponent = {
	id: 'mission-config-minimap',
	label: 'Configure Mission Builder Properties: Mini Map',
	short: 'MiniMap',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/minimap/Config.vue')
	),
	roles: MiniMapConfigRoles
};

export const ConfigComponentPointMarkerHome: VisualizationFormComponent = {
    id: 'mission-config-pointmarker-home',
    label: 'Configure Home Point Marker',
    short: 'Home Marker',
    component: defineAsyncComponent(
        () => import('@/modules/visualization/visualizations/pointmarker/Config.vue')
    ),
    roles: HomePointMarkerConfigRoles
};

export const ConfigComponentPointMarker: VisualizationFormComponent = {
    id: 'mission-config-pointmarker',
    label: 'Configure Vehicle Point Marker',
    short: 'Vehicle Marker',
    component: defineAsyncComponent(
        () => import('@/modules/visualization/visualizations/pointmarker/Config.vue')
    ),
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
	description: 'Create and manage missions for UAVs and ground vehicles.',
	formComponents: [
		ConfigComponent,
        ConfigComponentPointMarkerHome,
        ConfigComponentPointMarker,
		ConfigComponentMiniMap,
		CustomizeComponent
	],
	builder: () => import('@/modules/visualization/visualizations/mission/Builder'),
	supportsCs: true, // This visualization requires a controlstream to function
	requireCs: true, // This visualization requires a controlstream to function
	supportedMaps: ['cesium', 'leaflet'],
};
