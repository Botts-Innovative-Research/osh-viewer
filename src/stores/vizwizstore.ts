import {OSHControlStream, OSHDatastream} from '@/lib/OSHConnectDataStructs';
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
	const controlstreams = ref<OSHControlStream[]>([]); // OSH Controlstream objects

	// Visualization-scoped configs and customization
	const commonConfig = ref<CommonConfigProperties>({ playback: '', startTime: '', endTime: '' });
	const commonCustomization = ref<CommonCustomizationProperties>({});

	// Datastream-scoped configs and customization
	const dsConfig = ref<Record<string, Record<string, any>>>({});
	const dsCustomization = ref<Record<string, Record<string, any>>>({});
	const csCustomization = ref<Record<string, Record<string, any>>>({});
    const csConfig = ref<Record<string, Record<string, any>>>({});

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

    const setControlstreams = (val: OSHControlStream[]): void => {
        controlstreams.value = val;
        console.log('[VizWizStore] Set controlstreams:', val);
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
	const updateDsConfig = (role: string, patch: Partial<Record<string, any>>) => {
		if (!dsConfig.value[role]) {
			dsConfig.value[role] = {};
		}
		dsConfig.value[role] = {
			...dsConfig.value[role],
			...patch,
		};
		console.log('[VizWizStore] Updated DS config:', role, patch);
	};

    const updateCsConfig = (role: string, patch: Partial<Record<string, any>>) => {
        if (!csConfig.value[role]) {
            csConfig.value[role] = {};
        }
        csConfig.value[role] = {
            ...csConfig.value[role],
            ...patch,
        };
        console.log('[VizWizStore] Updated CS config:', role, patch);
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

    const updateCsCustomization = (csId: string, patch: Partial<Record<string, any>>) => {
        if (!csCustomization.value[csId]) {
            csCustomization.value[csId] = {};
        }
        csCustomization.value[csId] = {
            ...csCustomization.value[csId],
            ...patch,
        };
        console.log('[VizWizStore] Updated CS customization:', patch);
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
		controlstreams.value = [];
		// Globals
		commonConfig.value = { playback: '', startTime: '', endTime: '' };
		commonCustomization.value = {};
		// DS-specific
		dsConfig.value = {};
		csConfig.value = {};
		dsCustomization.value = {};
		csCustomization.value = {};
		visualizationCustomizationOptions.value = {};

		console.log('[VizWizStore] Store reset');
	};

	const resetDsConfig = () => {
		dsConfig.value = {};
		console.log('[VizWizStore] DS Config reset');
	};

	const resetDsCustomization = () => {
		dsCustomization.value = {};
		console.log('[VizWizStore] DS Customization reset');
	};

    const resetCsConfig = () => {
        csConfig.value = {};
        console.log('[VizWizStore] CS Config reset');
    };

    const resetCsCustomization = () => {
        csCustomization.value = {};
        console.log('[VizWizStore] CS Customization reset');
    };

	return {
		visualizationType,
		systems,
		datastreams,
        controlstreams,
		globalConfig: commonConfig,
		globalCustomization: commonCustomization,
		dsConfig,
        csConfig,
		dsCustomization,
		csCustomization,
    visualizationCustomizationOptions,
		setType,
		setSystems,
		setDatastreams,
        setControlstreams,
		updateGlobalConfig: updateCommonConfig,
		updateGlobalCustomization: updateCommonCustomization,
		updateDsConfig,
		updateCsConfig,
		updateDsCustomization,
		updateCsCustomization,
    setVisualizationCustomizationOptions,
		updateVisualizationCustomizationOptions,
		reset,
		resetDsConfig,
		resetCsConfig,
		resetDsCustomization,
		resetCsCustomization,
	};
});
