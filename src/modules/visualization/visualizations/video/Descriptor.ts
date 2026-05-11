import { defineAsyncComponent } from 'vue';
import { VisualizationDescriptor, VisualizationFormComponent } from "../../registry/types";

export const ConfigComponent: VisualizationFormComponent = {
	id: 'video-config',
	label: 'Configure Video Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/video/Config.vue')
	),
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'video-customize',
	label: 'Customize Video',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/video/Customize.vue')
	),
};

export const VideoDescriptor: VisualizationDescriptor = {
	label: 'Video',
	id: 'video',
	icon: 'mdi-video',
	viewLocation: 'panel',
	description: 'Display a video stream.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/video/Builder'),
};

// Type for PTZ command directions
export type Direction =
	| 'up'
	| 'down'
	| 'left'
	| 'right'
	| 'up-left'
	| 'up-right'
	| 'down-left'
	| 'down-right'
	| 'home'
	| 'zoomIn'
	| 'zoomOut';

// Define PTZ data interface
export interface PTZData {
	pan: number;
	tilt: number;
	zoom: number;
}
