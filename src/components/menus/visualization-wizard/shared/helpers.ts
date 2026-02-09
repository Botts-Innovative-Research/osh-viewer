import { useVizWizStore } from "@/stores/vizwizstore"
import { onBeforeUnmount, Ref } from "vue"
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';

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
 * Create a SweApi datasource from given datasource properties
 * 
 * @param dsProps - Array of datasource properties to create SweApi object
 * @returns Generated SweApi datasource instance
 */
export function createDatasource(dsProps: any) {
  const dsInstance = new SweApi(dsProps.id, {
    endpointUrl: dsProps.endpointUrl,
    resource: dsProps.resource,
    tls: dsProps.tls,
    protocol: dsProps.protocol,
    startTime: dsProps.startTime,
    endTime: dsProps.endTime,
    mode: dsProps.mode,
    responseFormat: dsProps.responseFormat,
    connectorOpts: {
      username: dsProps?.connectorOpts.username ?? '',
      password: dsProps?.connectorOpts.password ?? '',
    }
  });
  return dsInstance;
}

/**
 * Disconnects datasources on component UNMOUNT
 * 
 * @param dsInstances 
 */
export function useVisualizationCleanup(dsInstances: Ref<SweApi[]>) {
  onBeforeUnmount(() => {
    useDisconnectDatasources(dsInstances)
  })
}

/**
 * Disconnects SweApi datasources
 * 
 * @param dsInstances 
 */
export function useDisconnectDatasources(dsInstances: Ref<SweApi[]>) {
  const raw = dsInstances.value;

  const dsList = Array.isArray(raw)
    ? raw
    : raw
      ? [raw]
      : [];
  for (const ds of dsList) {
    console.log('[Disconnect Datasources] Disconnecting datasource:', ds)
    ds.disconnect()
  }
}
