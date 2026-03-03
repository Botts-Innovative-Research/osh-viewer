import { useVizWizStore } from "@/stores/vizwizstore"
import { onBeforeUnmount, Ref } from "vue"
//@ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import DataStream from 'osh-js/source/core/sweapi/datastream/DataStream.js';
import ObservationFilter from 'osh-js/source/core/sweapi/observation/ObservationFilter.js';
import { OSHControlStream, OSHDatastream } from "@/lib/OSHConnectDataStructs";
import { DataSourceProperties, ISweApiDataSourceProperties } from "@/lib/VisualizationHelpers";

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
 * Returns an array of OSHDatastream objects that are actually being used (associated with a selected role)
 * @returns 
 */
export function getUsedDatastreams(): OSHDatastream[] {
  const vizwizStore = useVizWizStore()

  // Get all dsIds that are actually selected for a role
  const selectedDsIds = Object.values(vizwizStore.dsConfig)
    .filter(entry => entry.selected && entry.dsId)
    .map(entry => entry.dsId)

  // Return OSHDatastream objects
  return vizwizStore.datastreams.filter(ds => selectedDsIds.includes(ds.id))
}

/**
 * Returns an array of OSHControlStream objects that are actually being used (associated with a selected role)
 * @returns 
 */
export function getUsedControlstreams(): OSHControlStream[] {
  const vizwizStore = useVizWizStore()

  // Get all csIds that are actually selected for a role
  const selectedCsIds = Object.values(vizwizStore.csConfig)
    .filter(entry => entry.selected && entry.csId)
    .map(entry => entry.csId)

  // Return OSHControlStream objects
  return vizwizStore.controlstreams.filter(cs => selectedCsIds.includes(cs.id))
}

/**
 * Create a SweApi datasource from given datasource properties
 * 
 * @param dsProps - Array of datasource properties to create SweApi object
 * @returns Generated SweApi datasource instance
 */
export function createDatasource(dsProps: ISweApiDataSourceProperties) {
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

/**
 * Generates a default visualization name based on selected viz type and a given role's datastream name
 * 
 * @param role
 * @returns 
 */
export function generateVizName(role: string) {
  const vizwizStore = useVizWizStore()

  // Find datastream ID of desired role
  const dsId = vizwizStore.dsConfig[role].dsId

  for (const ds of vizwizStore.datastreams) {
    if (ds.id === dsId) return `${vizwizStore.visualizationType}: ${ds.name}`
  }

  return `New ${vizwizStore.visualizationType}`
}


/**
 * Fetches the latest observation from a datasource
 *
 * @param dsProps - Datasource properties containing endpoint, id, and auth info
 * @returns Promise resolving to the latest observation data, or null if not found
 */
export const getLatestObservation = async (dsProps: {
    id: string
    endpointUrl: string
    tls: boolean
    connectorOpts?: { username: string; password: string }
}): Promise<any | null> => {
    const networkProperties = {
        endpointUrl: dsProps.endpointUrl,
        tls: dsProps.tls,
        connectorOpts: dsProps.connectorOpts ?? { username: '', password: '' }
    }

    const datastream = new DataStream({ id: dsProps.id }, networkProperties)

    const results = await datastream.searchObservations(
        new ObservationFilter({ resultTime: 'latest' }),
        1
    )

    const obsResult = await results.nextPage()
    return obsResult[0];
}