import { reactive, Ref, ref } from 'vue';
import { VisualizationConfigRole } from '../../registry/types';

/**
 * Keep track of validation state of each role
 * @param roles all roles
 * @returns
 */
export function useValidRoles(roles: readonly VisualizationConfigRole[]) {
	return reactive(Object.fromEntries(roles.map((config) => [config.role, ref(false)]))) as Record<
		string,
		Ref<boolean>
	>;
}
