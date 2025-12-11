import { OSHDatastream } from '@/lib/OSHConnectDataStructs';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { VisualizationCustomizationOptions } from '@/lib/visualization/wizard/VisualizationCustomizationOptions';

// Define global config properties
export interface GlobalConfigProperties {
	playback: string;
	startTime: string;
	endTime: string;
	[key: string]: any; // Allow other global config properties
}
// Define global customization
export interface GlobalCustomizationProperties {
	[key: string]: any; // Allow other global customization properties
}

export const useVizWizStore = defineStore('vizwiz', () => {
	const visualizationType = ref<string>('');
	const systems = ref<string[]>([]); // System IDs
	const datastreams = ref<OSHDatastream[]>([]); // OSH Datastream objects

	// Visualization-scoped configs and customization
	const globalConfig = ref<GlobalConfigProperties>({ playback: '', startTime: '', endTime: '' });
	const globalCustomization = ref<GlobalCustomizationProperties>({});

	// Datastream-scoped configs and customization
	const dsConfig = ref<Record<string, Record<string, any>>>({});
	const dsCustomization = ref<Record<string, Record<string, any>>>({});

	const visualizationCustomizationOptions = ref<VisualizationCustomizationOptions>({});

	const setType = (type: string): void => {
		visualizationType.value = type;
		console.log('[VizWizStore] Set type:', type);
	};

	const setSystems = (val: string[]): void => {
		systems.value = val;
		console.log('[VizWizStore] Set systems:', val);
	};

	const setDatastreams = (val: OSHDatastream[]): void => {
		datastreams.value = val;
		console.log('[VizWizStore] Set datastreams:', val);
	};

	// Globals
	const updateGlobalConfig = (patch: Partial<GlobalConfigProperties>) => {
		globalConfig.value = { ...globalConfig.value, ...patch };
		console.log('[VizWizStore] Updated global config:', patch);
		console.log('New global config:', globalConfig.value);
	};

	const updateGlobalCustomization = (patch: Partial<GlobalCustomizationProperties>) => {
		globalCustomization.value = { ...globalCustomization.value, ...patch };
		console.log('[VizWizStore] Updated global customization:', patch);
	};

	// Datastream-specific
	const updateDsConfig = (dsId: string, patch: Partial<Record<string, any>>) => {
		if (!dsConfig.value[dsId]) {
			dsConfig.value[dsId] = {};
		}
		dsConfig.value[dsId] = {
			...dsConfig.value[dsId],
			...patch,
		};
		console.log('[VizWizStore] Updated DS config:', patch);
	};
	const updateDsCustomization = (dsId: string, patch: Partial<Record<string, any>>) => {
		if (!dsCustomization.value[dsId]) {
			dsCustomization.value[dsId] = {};
		}
		dsCustomization.value[dsId] = {
			...dsCustomization.value[dsId],
			...patch,
		};
		console.log('[VizWizStore] Updated DS customization:', patch);
	};

	const setVisualizationCustomizationOptions = (options: VisualizationCustomizationOptions) => {
		visualizationCustomizationOptions.value = options;
	};

	const updateVisualizationCustomizationOptions = (
		patch: Partial<VisualizationCustomizationOptions>
	) => {
		visualizationCustomizationOptions.value = {
			...visualizationCustomizationOptions.value,
			...patch,
		};
	};

	// RESET STORE STATE
	const reset = () => {
		visualizationType.value = '';
		systems.value = [];
		datastreams.value = [];
		// Globals
		globalConfig.value = { playback: '', startTime: '', endTime: '' };
		globalCustomization.value = {};
		// DS-specific
		dsConfig.value = {};
		dsCustomization.value = {};
		visualizationCustomizationOptions.value = {};

		console.log('[VizWizStore] Store reset');
	};

	return {
		visualizationType,
		systems,
		datastreams,
		globalConfig,
		globalCustomization,
		dsConfig,
		dsCustomization,
		visualizationCustomizationOptions,
		setType,
		setSystems,
		setDatastreams,
		updateGlobalConfig,
		updateGlobalCustomization,
		updateDsConfig,
		updateDsCustomization,
		setVisualizationCustomizationOptions,
		updateVisualizationCustomizationOptions,
		reset,
	};
});
