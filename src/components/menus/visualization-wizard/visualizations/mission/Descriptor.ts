import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'mission-config',
  label: 'Configure Mission Builder Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/mission/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'mission-customize',
  label: 'Customize Mission Builder',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/mission/Customize.vue')
    ),
}

export const MissionDescriptor: VisualizationDescriptor = {
  label: 'Mission Builder',
  id: 'mission',
  icon: 'mdi-airplane-plus',
  viewLocation: 'multi',
  description: 'Create and manage missions for a drone.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/mission/Builder'),
  requireCs: true, // This visualization requires a controlstream to function
}