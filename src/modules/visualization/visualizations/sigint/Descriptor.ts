import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from '../../registry/types';
import { EllipseConfigRoles } from '../ellipse/Descriptor';
import { deriveRoles } from '../../registry/roleUtils';

export const ConfigComponentPointMarker: VisualizationFormComponent = {
	id: 'sigint-config-pointmarker',
	label: 'Configure SigInt Properties: Point Marker',
	short: 'Point Marker',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/pointmarker/Config.vue')
	),
};
export const ConfigComponentLob: VisualizationFormComponent = {
	id: 'sigint-config-lob',
	label: 'Configure SigInt Properties: Line of Bearing',
	short: 'LoB',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/lob/Config.vue')
	),
};
export const ConfigComponentEllipse: VisualizationFormComponent = {
	id: 'sigint-config-ellipse',
	label: 'Configure SigInt Properties: Ellipse',
	short: 'Ellipse',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/ellipse/Config.vue')
	),
	roles: deriveRoles(EllipseConfigRoles, {}, { required: false }),
	optional: true,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'sigint-customize',
	label: 'Customize SigInt',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/sigint/Customize.vue')
	),
};

export const SigIntDescriptor: VisualizationDescriptor = {
	label: 'SigInt',
	id: 'sigint',
	icon: 'mdi-star-box-outline',
	viewLocation: 'map',
	layers: ['PointMarkerLayer', 'LoB', 'EllipseLayer'],
	description: 'Visualize SigInt sensor on the map.',
	formComponents: [
		ConfigComponentPointMarker,
		ConfigComponentLob,
		ConfigComponentEllipse,
		CustomizeComponent,
	],
	builder: () => import('@/modules/visualization/visualizations/sigint/Builder'),
	supportsCs: false,
	requireCs: false,
	supportedMaps: ['cesium'],
};
