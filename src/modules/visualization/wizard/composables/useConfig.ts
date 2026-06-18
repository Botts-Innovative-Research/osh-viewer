import { computed, onMounted, watch } from 'vue';
import { useCheckedRoles } from './useCheckedRoles';
import { useValidRoles } from './useValidRoles';
import { useVizWizStore } from '@/stores/vizwizstore';
import type { VisualizationConfigRole } from '../../registry/types';

export function useConfig(configRoles: VisualizationConfigRole[]) {
	const vizwizStore = useVizWizStore();

	const checkedRoles = useCheckedRoles(configRoles, vizwizStore);
	const validRoles = useValidRoles(configRoles);

	function applyRequiredDefaults(source: Record<string, any>) {
		configRoles.forEach((config) => {
			if (config.required && !source[config.role]) {
				vizwizStore.updateDsConfig(config.role, { selected: true });
			}
		});
	}

	onMounted(() => {
		applyRequiredDefaults(vizwizStore.dsConfig);
	});

	watch(
		() => vizwizStore.dsConfig,
		(newVal) => {
			applyRequiredDefaults(newVal);
		},
		{ deep: true }
	);

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
