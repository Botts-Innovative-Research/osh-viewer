import { defineAsyncComponent } from 'vue';
import {
  VisualizationConfigRole,
  VisualizationDescriptor,
  VisualizationFormComponent,
} from '../../registry/types';

export const AudioConfigRoles: VisualizationConfigRole[] = [
  {
    role: 'x',
    label: 'X Axis',
    description: 'Select the property to define the x-axis of the chart (e.g. time)',
    type: 'ds',
    required: true,
  },
  {
    role: 'y',
    label: 'Y Axis',
    description: 'Select properties to display on the y-axis, each as a separate line.',
    type: 'ds',
    required: true,
    multiple: true,
  },
];

export const ConfigComponent: VisualizationFormComponent = {
  id: 'audio-config',
  label: 'Configure Audio Properties',
  short: 'Configure',
  component: defineAsyncComponent(
      () => import('@/modules/visualization/visualizations/audio/Config.vue')
  ),
  roles: AudioConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
  id: 'audio-customize',
  label: 'Customize Audio',
  short: 'Customize',
  component: defineAsyncComponent(
      () => import('@/modules/visualization/visualizations/audio/Customize.vue')
  ),
};

export const AudioDescriptor: VisualizationDescriptor = {
  label: 'Audio',
  id: 'audio',
  icon: 'volume-high',
  viewLocation: 'panel',
  layers: ['CurveLayer'],
  description: 'Visualize data as an audio spectrogram.',
  formComponents: [ConfigComponent, CustomizeComponent],
  builder: () => import('@/modules/visualization/visualizations/audio/Builder'),
  supportsCs: false,
  requireCs: false,
};
