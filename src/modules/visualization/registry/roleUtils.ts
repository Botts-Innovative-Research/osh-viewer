import { VisualizationConfigRole } from './types';

/**
 * Select specific roles from a given array of VisualizationConfigRole's
 * @param roles - Set of VisualizationConfigRole's to derive from
 * @param overrides - Override specific roles with a partial VisualizationConfigRole
 * @param globalOverride - Optional global override of the roles
 * @returns
 */
export function deriveRoles<T extends readonly VisualizationConfigRole[]>(
	roles: T,
	overrides: Record<string, Partial<VisualizationConfigRole>> = {},
	globalOverride?: Partial<VisualizationConfigRole>
) {
	return roles.map((r) => ({
		...r,
		...(globalOverride ?? {}),
		...(overrides[r.role] ?? {}),
	}));
}
