import { VisualizationConfigRole } from './types';

/**
 * Select specific roles from a given array of VisualizationConfigRole's
 * @param roles - Base roles (all)
 * @param keys - Roles to filter for (include)
 * @returns
 */
export function pickRoles<T extends readonly VisualizationConfigRole[]>(roles: T, keys: string[]) {
	return roles.filter((r) => keys.includes(r.role));
}
