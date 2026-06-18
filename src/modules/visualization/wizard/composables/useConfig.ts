import { computed, onMounted, watch } from 'vue';
import { useCheckedRoles } from './useCheckedRoles';
import { useValidRoles } from './useValidRoles';
import { useVizWizStore } from '@/stores/vizwizstore';
import type { VisualizationConfigRole } from '../../registry/types';

export function useConfig(configRoles: VisualizationConfigRole[]) {
	const vizwizStore = useVizWizStore();

	const checkedRoles = useCheckedRoles(configRoles, vizwizStore);
	const validRoles = useValidRoles(configRoles);

	function applyRequiredDefaults() {
		configRoles.forEach((config) => {
			if (!config.required) return;

			if (config.type === 'ds') {
				if (!vizwizStore.dsConfig[config.role]) {
					vizwizStore.updateDsConfig(config.role, { selected: true });
				}
			} else {
				if (!vizwizStore.csConfig[config.role]) {
					vizwizStore.updateCsConfig(config.role, { selected: true });
				}
			}
		});
	}

	onMounted(applyRequiredDefaults);

	watch([() => vizwizStore.dsConfig, () => vizwizStore.csConfig], applyRequiredDefaults, {
		deep: true,
	});

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
	};
}
