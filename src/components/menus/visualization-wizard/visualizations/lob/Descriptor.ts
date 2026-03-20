import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'lob-config',
  label: 'Configure Line of Bearing Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/lob/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'lob-customize',
  label: 'Customize Line of Bearing',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/lob/Customize.vue')
    ),
}

export const LobDescriptor: VisualizationDescriptor = {
  label: 'Line of Bearing',
  id: 'lob',
  icon: 'mdi-ray-start',
  viewLocation: 'map',
  description: 'Visualize a point marker with a line indicating the line of bearing (LOB).',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/lob/Builder'),
}