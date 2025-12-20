import { OSHDatastream } from '@/lib/OSHConnectDataStructs';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { VisualizationCustomizationOptions } from '@/lib/visualization/wizard/VisualizationCustomizationOptions';
import { DatasourceOptions } from '@/lib/visualization/wizard/Datasources/DatasourceOptions';

// Define global config properties
export interface CommonConfigProperties {
	playback: string;
	startTime: string;
	endTime: string;
	[key: string]: any; // Allow other global config properties
}
// Define global customization
export interface CommonCustomizationProperties {
	[key: string]: any; // Allow other global customization properties
}

export const useVizWizStore = defineStore('vizwiz', () => {
	const visualizationType = ref<string>('');
	const systems = ref<string[]>([]); // System IDs
	const datastreams = ref<OSHDatastream[]>([]); // OSH Datastream objects

	// Visualization-scoped configs and customization
	const commonConfig = ref<CommonConfigProperties>({ playback: '', startTime: '', endTime: '' });
	const commonCustomization = ref<CommonCustomizationProperties>({});

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
	const updateCommonConfig = (patch: Partial<CommonConfigProperties>) => {
		commonConfig.value = { ...commonConfig.value, ...patch };
		console.log('[VizWizStore] Updated global config:', patch);
		console.log('New global config:', commonConfig.value);
	};

	const updateCommonCustomization = (patch: Partial<CommonCustomizationProperties>) => {
		commonCustomization.value = { ...commonCustomization.value, ...patch };
		console.log('[VizWizStore] Updated global customization:', patch);
	};

	// Datastream-specific
	/**
	 * Update the given basic datasource configuration properties for the datastream with corresponding ID.
	 * @param dsId
	 * @param patch
	 */
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
		commonConfig.value = { playback: '', startTime: '', endTime: '' };
		commonCustomization.value = {};
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
		globalConfig: commonConfig,
		globalCustomization: commonCustomization,
		dsConfig,
		dsCustomization,
		visualizationCustomizationOptions,
		setType,
		setSystems,
		setDatastreams,
		updateGlobalConfig: updateCommonConfig,
		updateGlobalCustomization: updateCommonCustomization,
		updateDsConfig,
		updateDsCustomization,
		setVisualizationCustomizationOptions,
		updateVisualizationCustomizationOptions,
		reset,
	};
});
