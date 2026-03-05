import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'geoPtz-config',
  label: 'Configure GeoPTZ Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/geoptz/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'geoPtz-customize',
  label: 'Customize GeoPTZ',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/geoptz/Customize.vue')
    ),
}

export const GeoPtzDescriptor: VisualizationDescriptor = {
  label: 'GeoPTZ',
  id: 'geoPtz',
  icon: 'mdi-map',
  viewLocation: 'multi',
  description: 'Task supported sensors with LLA coordinates.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/geoptz/Builder'),
}