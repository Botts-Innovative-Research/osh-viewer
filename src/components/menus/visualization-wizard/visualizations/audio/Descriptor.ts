import { defineAsyncComponent } from "vue";
import { VisualizationDescriptor, VisualizationFormComponent } from "../../VisualizationRegistry";

export const ConfigComponent: VisualizationFormComponent = {
  id: 'audio-config',
  label: 'Configure Audio Properties',
  short: 'Configure',
  component: defineAsyncComponent(
			() => import('@/components/menus/visualization-wizard/visualizations/audio/Config.vue')
		),
}

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'audio-customize',
  label: 'Customize Audio',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/components/menus/visualization-wizard/visualizations/audio/Customize.vue')
    ),
}

export const AudioDescriptor: VisualizationDescriptor = {
  label: 'Audio',
  id: 'audio',
  icon: 'volume-high',
  viewLocation: 'panel',
  description: 'Visualize data as an audio spectrogram.',
  formComponents: [
    ConfigComponent,
    CustomizeComponent,
  ],
  builder: () => import('@/components/menus/visualization-wizard/visualizations/audio/Builder'),
}