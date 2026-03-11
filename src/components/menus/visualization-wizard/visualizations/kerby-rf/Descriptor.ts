import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'kerby-rf-config',
  label: 'Configure Kerby RF Data Sources',
  short: 'Configure',
  component: defineAsyncComponent(
    () => import('@/components/menus/visualization-wizard/visualizations/kerby-rf/Config.vue')
  ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'kerby-rf-customize',
  label: 'Customize Kerby RF Panel',
  short: 'Customize',
  component: defineAsyncComponent(
    () => import('@/components/menus/visualization-wizard/visualizations/kerby-rf/Customize.vue')
  ),
}

export const KerbyRfDescriptor: VisualizationDescriptor = {
  label: 'Kerby RF',
  id: 'kerby-rf',
  icon: 'mdi-antenna',
  viewLocation: 'panel',
  description: 'Kerby RF sensor platform control panel with tuner, demod, positioner, and system status.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/kerby-rf/Builder'),
}
