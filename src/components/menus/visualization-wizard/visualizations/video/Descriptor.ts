import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'video-config',
  label: 'Configure Video Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/video/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'video-customize',
  label: 'Customize Video',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/video/Customize.vue')
    ),
}

export const VideoDescriptor: VisualizationDescriptor = {
  label: 'Video',
  id: 'video',
  icon: 'mdi-video',
  viewLocation: 'panel',
  description: 'Display a video stream.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/video/Builder'),
}