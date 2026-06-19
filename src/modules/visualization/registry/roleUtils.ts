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

/**
 * Confirm true/false that all required "findRoles" exist in the collection of "allConfigs"
 * @param findRoles - VisualizationConfigRole[] to confirm exist
 * @param allConfigs - from vizwizstore dsConfig / csConfig
 * @returns
 */
export function confirmRoles<T extends readonly VisualizationConfigRole[]>(
	findRoles: T,
	...allConfigs: Array<Record<string, Record<string, any>>>
) {
	return findRoles
		.filter((role) => role.required)
		.every(({ role }) => allConfigs.some((config) => role in config));
}
