import { defineAsyncComponent } from "vue";
import { ViewLocation, VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'text-config',
  label: 'Configure Text Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/text/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'text-customize',
  label: 'Customize Text',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/text/Customize.vue')
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
  builder: () => import('@/components/menus/visualization-wizard/visualizations/text/Builder'),
}