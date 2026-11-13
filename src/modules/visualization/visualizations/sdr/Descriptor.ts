import { defineAsyncComponent } from 'vue';
import {
	VisualizationConfigRole,
	VisualizationDescriptor,
	VisualizationFormComponent,
} from '../../registry/types';

export const SdrConfigRoles: VisualizationConfigRole[] = [
	{
		role: 'amplitude',
		label: 'Spectrum Amplitude',
		description: 'Select the property containing RF spectrum power/amplitude bins (e.g. amplitude in dBFS).',
		type: 'ds',
		required: true,
	},
	{
		role: 'centerFrequency',
		label: 'Center Frequency',
		description: 'Select the property containing the tuned center frequency in Hz or MHz.',
		type: 'ds',
		required: false,
	},
	{
		role: 'frequencyAxis',
		label: 'Frequency Axis',
		description: 'Select the property containing explicit frequency axis bins (optional, computed if omitted).',
		type: 'ds',
		required: false,
	},
	{
		role: 'sampleRate',
		label: 'Sample Rate / Span',
		description: 'Select the property containing sample rate or bandwidth in Hz.',
		type: 'ds',
		required: false,
	},
	{
		role: 'sdrControl',
		label: 'SDR Receiver Control',
		description: 'Select the controlstream to enable interactive center frequency tuning, gain, and demodulation.',
		type: 'cs',
		required: false,
		showPropertySelector: false,
	},
];

export const ConfigComponent: VisualizationFormComponent = {
	id: 'sdr-config',
	label: 'Configure SDR Properties',
	short: 'Configure',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/sdr/Config.vue')
	),
	roles: SdrConfigRoles,
};

export const CustomizeComponent: VisualizationFormComponent = {
	id: 'sdr-customize',
	label: 'Customize SDR',
	short: 'Customize',
	component: defineAsyncComponent(
		() => import('@/modules/visualization/visualizations/sdr/Customize.vue')
	),
};

export const SdrDescriptor: VisualizationDescriptor = {
	label: 'SDR',
	id: 'sdr',
	icon: 'mdi-radio-tower',
	viewLocation: 'panel',
	layers: ['SdrLayer'],
	description: 'Visualize RF spectrum analyzer and waterfall spectrogram from Software-Defined Radio (SDR) sensors.',
	formComponents: [ConfigComponent, CustomizeComponent],
	builder: () => import('@/modules/visualization/visualizations/sdr/Builder'),
	supportsCs: true,
	requireCs: false,
};
