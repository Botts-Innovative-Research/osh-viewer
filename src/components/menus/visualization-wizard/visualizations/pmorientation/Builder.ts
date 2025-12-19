import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs'
import {
  IMapLayerProperties,
  IMapViewProperties,
  ISweApiDataSourceProperties,
  VisualizationComponents,
} from '@/lib/VisualizationHelpers'
import { useDataStreamStore } from '@/stores/datastreamstore'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { useVizWizStore } from '@/stores/vizwizstore'
import { Mode } from 'osh-js/source/core/datasource/Mode'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'

export function build() {
  console.log('Building PM Orientation Visualization...')
  const vizwizStore = useVizWizStore()
  const visualizationStore = useVisualizationStore()

  // Aggregate datastreams from vizwizStore
  const datastreams = AggregateDatastreams()
  console.log('Aggregated datastreams for PM Orientation:', datastreams)

  const pmResult = CreateMapViewProps(datastreams, vizwizStore.globalConfig)
  const visualizationComponents: VisualizationComponents = {
    dataSource: pmResult.vizDatasources,
    dataLayer: pmResult.mapLayer,
    dataView: pmResult.mapView,
  }

  const newViz: OSHVisualization = new OSHVisualization(
    `visualization-${randomUUID()}`,
    'test',
    'pmorientation',
    null,
    datastreams,
    null,
  )
  newViz.setVisualizationComponents(visualizationComponents)
  visualizationStore.addVisualization(newViz)
  console.log('Created PM Orientation Visualization:', newViz)
}

/**
 * Creates properties for a Map View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedProperty
 * @param visOptions
 * @constructor
 */
export function CreateMapViewProps(datastreams: { [key: string]: any }, visOptions: any) {
  const datastreamStore = useDataStreamStore()
  console.log('Datastreams: ', datastreamStore.dataStreams)

  const vizDatasources: ISweApiDataSourceProperties[] = []
  let mapLayer: any = {}

  // Iterate through each unique datastream ID
  for (const [dsId, entry] of Object.entries(datastreams)) {
    console.log('Processing datastream ID:', dsId, 'with entry:', entry)

    // Get selected properties for each role of the datastream
    const properties = BuildRoleProperty(entry)

    // Push new ISweApiDataSourceProperties
    const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId])
    const currentDataSource: ISweApiDataSourceProperties = {
      endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
      resource: `/datastreams/${dsId}/observations`,
      tls: currentOSHDatastream[0].datastream.networkProperties.tls,
      protocol: 'ws',
      startTime: visOptions.startTime || 'now',
      endTime: visOptions.endTime || '2125-08-01T00:00:00Z',
      mode: Mode.REAL_TIME, // TODO: Make configurable
      responseFormat: 'application/swe+json',
      id: randomUUID(), // TODO: Remove if not needed
      properties: properties,
    }
    vizDatasources.push(currentDataSource)

    // TODO: Remove if this approach is no longer needed
    // // Add location if role is selected
    // if (properties.location) {
    //   mapLayer.getLocation = {
    //     dataSourceIds: [currentDataSource.id],
    //     handler: (rec: any) => {
    //       return {
    //         x: rec[properties.location].lon,
    //         y: rec[properties.location].lat,
    //         z: rec[properties.location].alt || 0, // Default to 0 if altitude is not provided
    //       }
    //     },
    //   }
    // }
    // // Add orientation if role is selected
    // if (properties.orientation) {
    //   mapLayer.getOrientation = {
    //     dataSourceIds: [currentDataSource.id],
    //     handler: (rec: any) => {
    //       return {
    //         heading: rec[properties.orientation].heading,
    //       }
    //     },
    //   }
    // }
    // // Add markerId if role is selected
    // // TODO: Implement markerId handling
  }

  // Build remaining mapLayer properties
  mapLayer = {
    ...mapLayer,
    dataSourceIds: [...vizDatasources.map((ds: any) => ds.id)],
    markerColor: visOptions.markerColor || 'red',
    markerIcon: visOptions.markerIcon || undefined,
    name: `${randomUUID()} - PM Orientation Layer`,
    icon: '/icons/map/map-marker.svg',
    iconSize: [32, 32],
    labelOffset: [-16, -32],
  }

  // Build MapViewProperties
  const mapView: IMapViewProperties = {
    container: `map-container-${randomUUID()}`,
    layers: [mapLayer],
    css: 'map-view',
    refreshRate: 1000,
  }

  console.log('Created MapViewProps:', { vizDatasources, mapLayer, mapView })

  return {
    vizDatasources,
    mapLayer,
    mapView,
  }
}

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
  const result: any = {}

  const vizwizStore = useVizWizStore()

  for (const [role, entry] of Object.entries(vizwizStore.dsConfig)) {
    console.log('Processing role:', role, 'with entry:', entry)

    if (!entry.selected) {
      continue // Skip unselected roles
    }

    // Initialize array for role if not present
    if (!result[entry.ds.id]) {
      result[entry.ds.id] = []
    }

    // Add selected property to role's array
    result[entry.ds.id].push({
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
