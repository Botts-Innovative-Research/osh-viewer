import { useVizWizStore } from "@/stores/vizwizstore"
import { onBeforeUnmount, Ref } from "vue"

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

    // Skip entries without dsId (these are controlstreams)
    if (!entry.dsId) {
      continue
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

export function AggregateControlstreams() {
  const vizwizStore = useVizWizStore()

  const result: any = {}

  for (const [role, entry] of Object.entries(vizwizStore.csConfig)) {
    console.log('Processing controlstream role:', role, 'with entry:', entry)

    if (!entry['selected']) {
      continue // Skip unselected roles
    }

    // Skip entries without csId (these are datastreams)
    if (!entry.csId) {
      continue
    }

    // Initialize array for role if not present
    if (!result[entry.csId]) {
      result[entry.csId] = []
    }

    // Add selected property to role's array
    result[entry.csId].push({
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
        if (roleEntry.compression)
            return [role, { property: roleEntry.property, outputName: roleEntry.outputName, compression: roleEntry.compression }]
        return [role, { property: roleEntry.property, outputName: roleEntry.outputName }]
    }),
  )
}

/**
 * Disconnects SweApi datasources on component unmount
 * 
 * @param dsInstances 
 */
export function useVisualizationCleanup(dsInstances: Ref<any[]>) {
  onBeforeUnmount(() => {
    const raw = dsInstances.value;

    const dsList = Array.isArray(raw)
      ? raw
      : raw
        ? [raw]
        : [];
    for (const ds of dsList) {
      console.log('[Visualization Cleanup] Disconnecting datasource:', ds)
      ds.disconnect()
    }
  })
}
