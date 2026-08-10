import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const PointMarkerConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'location',
		label: 'Location',
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
	{
		role: 'description',
		label: 'Description',
		description: 'Select a property to appear as the point marker popup.',
		type: 'ds',
        showPropertySelector: false,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'pointmarker-config',
	label: 'Configure Point Marker Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/pointmarker/Config.vue')
	),
	roles: PointMarkerConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'pointmarker-customize',
	label: 'Customize Point Marker',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/pointmarker/Customize.vue')
	),
};

export const PointMarkerDescriptor: VisualizationDescriptor = {
	label: 'Point Marker',
	id: 'pointmarker',
	icon: 'mdi-map-marker',
	viewLocation: 'map',
	layers: ['PointMarkerLayer'],
	description: 'Visualize a point marker on the map.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: async () => import('@/modules/visualization/visualizations/pointmarker/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium', 'leaflet'],
};
