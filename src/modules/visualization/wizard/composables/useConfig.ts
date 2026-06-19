import { computed, onMounted, ref, Ref, watch } from 'vue';
import { useCheckedRoles } from './useCheckedRoles';
import { useValidRoles } from './useValidRoles';
import { useVizWizStore } from '@/stores/vizwizstore';
import type { VisualizationConfigRole } from '../../registry/types';
import { confirmRoles } from '../../registry/roleUtils';

export function useConfig(configRoles: VisualizationConfigRole[]) {
	const vizwizStore = useVizWizStore();

	// Whether the config step is included in the visualization
	const include: Ref<boolean> = ref(
		confirmRoles(configRoles, vizwizStore.dsConfig, vizwizStore.csConfig)
	);

	const checkedRoles = useCheckedRoles(configRoles, vizwizStore);
	const validRoles = useValidRoles(configRoles);

	function applyRequiredDefaults() {
		configRoles.forEach((config) => {
			if (!config.required) return;

			const store = config.type === 'ds' ? vizwizStore.dsConfig : vizwizStore.csConfig;

			const update =
				config.type === 'ds' ? vizwizStore.updateDsConfig : vizwizStore.updateCsConfig;

			if (!store[config.role]) {
				update(config.role, { selected: true });
			}
		});
	}

	function clearAllRoles() {
		configRoles.forEach((config) => {
			const storeConfig = config.type === 'ds' ? 'dsConfig' : 'csConfig';

			// remove from store
			if (vizwizStore[storeConfig][config.role]) {
				delete vizwizStore[storeConfig][config.role];
			}
		});
		console.log(vizwizStore.dsConfig, vizwizStore.csConfig);
	}

	function syncConfigState() {
		if (include.value) {
			applyRequiredDefaults();
		} else {
			clearAllRoles();
		}
	}

	// Run on mount
	onMounted(syncConfigState);

	// React to toggle
	watch(include, syncConfigState);

	const valid = computed(() =>
		configRoles.every((config) => {
			if (!checkedRoles[config.role]) return true;
			return validRoles[config.role];
		})
	);

	return {
		checkedRoles,
		validRoles,
		valid,
		include,
	};
}
