import { defineAsyncComponent } from "vue";
import { ViewLocation, VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'chart-config',
  label: 'Configure Chart Properties',
  short: 'Configure',
  component: defineAsyncComponent(
			() => import('@/components/menus/visualization-wizard/visualizations/chart/Config.vue')
		),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'chart-customize',
  label: 'Customize Chart',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/chart/Customize.vue')
    ),
}

export const ChartDescriptor: VisualizationDescriptor = {
  label: 'Chart',
  id: 'chart',
  icon: 'mdi-chart-line',
  viewLocation: 'panel',
  description: 'Visualize data as a chart.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/chart/Builder'),
}