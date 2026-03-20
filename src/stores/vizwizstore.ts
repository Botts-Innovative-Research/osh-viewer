import {OSHControlStream, OSHDatastream} from '@/lib/OSHConnectDataStructs';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { VisualizationCustomizationOptions } from '@/lib/VisualizationHelpers';
import { useDataStreamStore } from './datastreamstore';
import { useControlStreamStore } from './controlstreamstore';

export interface WizardConfig {
	id: string;
	visualizationType: string;
	systems: string[];
	datastreamIds: string[];
	controlstreamIds: string[];
	dsConfig: Record<string, Record<string, any>>;
	csConfig: Record<string, Record<string, any>>;
	visualizationCustomizationOptions: any;
}

export const useVizWizStore = defineStore('vizwiz', () => {
	const id = ref<string>('');
	const visualizationType = ref<string>('');
	const systems = ref<string[]>([]); // System IDs
	const datastreams = ref<OSHDatastream[]>([]); // OSH Datastream objects
	const controlstreams = ref<OSHControlStream[]>([]); // OSH Controlstream objects

	// Datastream-scoped configs and customization
	const dsConfig = ref<Record<string, Record<string, any>>>({});
	const csConfig = ref<Record<string, Record<string, any>>>({});

	const visualizationCustomizationOptions = ref<any>({});

	const setId = (val: string): void => {
		id.value = val;
		console.log('[VizWizStore] Set ID:', val);
	};

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

	const resetDsConfig = () => {
		dsConfig.value = {};
		console.log('[VizWizStore] DS Config reset');
	};

	const resetCsConfig = () => {
		csConfig.value = {};
		console.log('[VizWizStore] CS Config reset');
	};

	// Clear viz wiz EXCLUDING ID
	const clear = () => {
		// DON'T DELETE ID
		visualizationType.value = '';
		systems.value = [];
		datastreams.value = [];
		controlstreams.value = [];
		dsConfig.value = {};
		csConfig.value = {};
		visualizationCustomizationOptions.value = {};

		console.log('[VizWizStore] Store cleared, ID persisted:', id.value);
	};

	// RESET STORE STATE
	const reset = () => {
		id.value = '';
		visualizationType.value = '';
		systems.value = [];
		datastreams.value = [];
		controlstreams.value = [];
		dsConfig.value = {};
		csConfig.value = {};
		visualizationCustomizationOptions.value = {};

		console.log('[VizWizStore] Store reset');
	};

	// RETURN STORE STATE -> For saving in visualization
	const getWizardConfig = (): WizardConfig => {
		// Save only IDs for serialization purposes
		const getIds = (streams: OSHDatastream[] | OSHControlStream[] | null): string[] => {
			return streams != null
				? streams.map((item: OSHDatastream | OSHControlStream) => item.id)
				: [];
		};

		return {
			id: id.value,
			visualizationType: visualizationType.value,
			systems: systems.value,
			datastreamIds: getIds(datastreams.value),
			controlstreamIds: getIds(controlstreams.value),
			dsConfig: dsConfig.value,
			csConfig: csConfig.value,
			visualizationCustomizationOptions: visualizationCustomizationOptions.value,
		};
	};

	// RESTORE STORE STATE -> For editing visualization
	const setWizardConfig = (config: WizardConfig) => {
		// Get OSHDatastream | OSHControlstream objects by ID
		const datastreamObjs = useDataStreamStore().getDataStreamsById(config.datastreamIds);
		const controlstreamObjs = useControlStreamStore().getControlStreamsById(
			config.controlstreamIds
		);

		id.value = config.id;
		visualizationType.value = config.visualizationType;
		systems.value = config.systems;
		datastreams.value = datastreamObjs;
		controlstreams.value = controlstreamObjs;
		dsConfig.value = config.dsConfig;
		csConfig.value = config.csConfig;
		visualizationCustomizationOptions.value = config.visualizationCustomizationOptions;

		console.log('[VizWizStore] Store restored');
	};

	return {
		id,
		visualizationType,
		systems,
		datastreams,
		controlstreams,
		dsConfig,
		csConfig,
		visualizationCustomizationOptions,
		setId,
		setType,
		setSystems,
		setDatastreams,
		setControlstreams,
		updateDsConfig,
		updateCsConfig,
		setVisualizationCustomizationOptions,
		updateVisualizationCustomizationOptions,
		clear,
		reset,
		resetDsConfig,
		resetCsConfig,
		getWizardConfig,
		setWizardConfig,
	};
});
