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

			const store = config.type === 'ds' ? vizwizStore.dsConfig : vizwizStore.csConfig;

			const update =
				config.type === 'ds' ? vizwizStore.updateDsConfig : vizwizStore.updateCsConfig;

			if (!store[config.role]) {
				update(config.role, { selected: true });
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
