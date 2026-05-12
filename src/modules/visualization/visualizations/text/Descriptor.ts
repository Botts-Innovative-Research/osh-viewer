import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../registry/types";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'text-config',
  label: 'Configure Text Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/modules/visualization/visualizations/text/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'text-customize',
  label: 'Customize Text',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/modules/visualization/visualizations/text/Customize.vue')
    ),
}

export const TextDescriptor: VisualizationDescriptor = {
  label: 'Text',
  id: 'text',
  icon: 'mdi-format-text',
  viewLocation: 'panel',
  description: 'Display selected properties from a datastream.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/modules/visualization/visualizations/text/Builder'),
}