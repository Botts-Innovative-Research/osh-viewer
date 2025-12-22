import { useVizWizStore } from "@/stores/vizwizstore"

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
export function AggregateDatastreams() {
  const vizwizStore = useVizWizStore()

  const result: any = {}

  for (const [role, entry] of Object.entries(vizwizStore.dsConfig)) {
    console.log('Processing role:', role, 'with entry:', entry)

    if (!entry['selected']) {
      continue // Skip unselected roles
    }

    // Initialize array for role if not present
    if (!result[entry.dsId]) {
      result[entry.dsId] = []
    }

    // Add selected property to role's array
    result[entry.dsId].push({
      [role]: entry,
    })
  }

  return result
}

/**
 * Returns a mapping of roles to their selected property name
 * @param entry 
 * @returns 
 */
export function BuildRoleProperty(entry: any[]) {
  return Object.fromEntries(
    entry.map((roleObj: any) => {
      const role = Object.keys(roleObj)[0]
      const roleEntry = roleObj[role]

      // Return [role, property string]
      return [role, roleEntry.property]
    }),
  )
}
