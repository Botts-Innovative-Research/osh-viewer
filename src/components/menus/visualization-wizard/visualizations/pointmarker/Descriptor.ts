import { defineAsyncComponent } from "vue";
import { ViewLocation, VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'pointmarker-config',
  label: 'Configure Point Marker Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/pointmarker/Config.vue')
    ),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'pointmarker-customize',
  label: 'Customize Point Marker',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/pointmarker/Customize.vue')
    ),
}

export const PointMarkerDescriptor: VisualizationDescriptor = {
  label: 'Point Marker',
  id: 'pointmarker',
  icon: 'mdi-map-marker',
  viewLocation: 'map',
  description: 'Visualize a point marker on the map.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/pointmarker/Builder'),
}