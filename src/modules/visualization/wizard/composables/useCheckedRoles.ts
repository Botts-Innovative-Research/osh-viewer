import { computed, reactive, Ref, ref } from 'vue';
import { VisualizationConfigRole } from '../../registry/types';

/**
 * Keep track of selected/unselected state of each role
 * Uses ds/cs config in vizwiz based on type
 * @param roles all roles
 * @param store viz wiz store
 * @returns
 */
export function useCheckedRoles(roles: readonly VisualizationConfigRole[], store: any) {
	return reactive(
		Object.fromEntries(
			roles.map((config) => [
				config.role,
				computed({
					get: () => {
						const storeConfig = config.type === 'ds' ? 'dsConfig' : 'csConfig';
						return (
							store[storeConfig][config.role]?.selected ?? config.required ?? false
						);
					},

					set: (val: boolean) => {
						const storeConfig = config.type === 'ds' ? 'dsConfig' : 'csConfig';
						const setStoreConfig =
							config.type === 'ds' ? 'updateDsConfig' : 'updateCsConfig';
						if (val) {
							store[setStoreConfig](config.role, {
								selected: true,
							});
						} else if (!config.required) {
							delete store[storeConfig][config.role];
						}
					},
				}),
			])
		)
	);
}
