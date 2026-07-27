import type { OSHControlStream, OSHDatastream } from '@/lib/OSHConnectDataStructs';

/**
 * Aggregates datastreams from vizwizStore.dsConfig based on selected roles.
 *
 * @returns aggregated datastreams, keyed by ds ID
 * {
 *  "dsId1": [
 *    { "role1": { "selected": true, "ds": { ... }, "property": "prop1" } },
 *    { "role2": { "selected": true, "ds": { ... }, "property": "prop2" } },
 *  ],
 *  "dsId2": [
 *    { "role1": { "selected": true, "ds": { ... }, "property": "prop1" } },
 *  ],
 * }
 */
export function AggregateDatastreams(dsConfig: any) {
	const result: any = {};

	for (const [role, entry] of Object.entries(dsConfig) as [string, any][]) {
		if (!entry['selected']) {
			continue; // Skip unselected roles
		}

		// Skip entries without dsId (these are controlstreams)
		if (!entry.dsId) {
			continue;
		}

		// Initialize array for role if not present
		if (!result[entry.dsId]) {
			result[entry.dsId] = [];
		}

		// Add selected property to role's array
		result[entry.dsId].push({
			[role]: entry,
		});
	}

	return result;
}

export function AggregateControlstreams(csConfig: any) {
	const result: any = {};

	for (const [role, entry] of Object.entries(csConfig) as [string, any][]) {
		if (!entry['selected']) {
			continue; // Skip unselected roles
		}

		// Skip entries without csId (these are datastreams)
		if (!entry.csId) {
			continue;
		}

		// Initialize array for role if not present
		if (!result[entry.csId]) {
			result[entry.csId] = [];
		}

		// Add selected property to role's array
		result[entry.csId].push({
			[role]: entry,
		});
	}

	return result;
}

/**
 * Returns a mapping of roles to their selected property name
 * @param entry
 * @returns
 */
export function BuildRoleProperty(entry: any[]) {
	return Object.fromEntries(
		entry.map((roleObj: any) => {
			const role = Object.keys(roleObj)[0];
			const roleEntry = roleObj[role];

			const propertyConfig: Record<string, any> = {
				property: roleEntry.property,
				outputName: roleEntry.outputName,
			};
			if (roleEntry.label !== undefined) propertyConfig.label = roleEntry.label;
			if (roleEntry.uom !== undefined) propertyConfig.uom = roleEntry.uom;
			if (roleEntry.compression) propertyConfig.compression = roleEntry.compression;

			return [role, propertyConfig];
		})
	);
}

/**
 * Returns an array of OSHDatastream objects that are actually being used (associated with a selected role)
 * @returns
 */
export function getUsedDatastreams(datastreams: OSHDatastream[], dsConfig: any): OSHDatastream[] {
	// Get all dsIds that are actually selected for a role
	const selectedDsIds = Object.values(dsConfig)
		.filter((entry: any) => entry.selected && entry.dsId)
		.map((entry: any) => entry.dsId);

	// Return OSHDatastream objects
	return datastreams.filter((ds: OSHDatastream) => selectedDsIds.includes(ds.id));
}

/**
 * Returns an array of OSHControlStream objects that are actually being used (associated with a selected role)
 * @returns
 */
export function getUsedControlstreams(
	controlstreams: OSHControlStream[],
	csConfig: any
): OSHControlStream[] {
	// Get all csIds that are actually selected for a role
	const selectedCsIds = Object.values(csConfig)
		.filter((entry: any) => entry.selected && entry.csId)
		.map((entry: any) => entry.csId);

	// Return OSHControlStream objects
	return controlstreams.filter((cs: OSHControlStream) => selectedCsIds.includes(cs.id));
}
