import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs'
import {
  IMapLayerProperties,
  IMapViewProperties,
  ISweApiDataSourceProperties,
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

  CreateMapViewProps(datastreams, vizwizStore.globalConfig)

  // // if (locationDs && orientationDs) {
  // if (locationDs && orientationDs) {
  //   console.log('Found locationDs and orientationDs, building visualization...')
  //   const pmResult = CreateMapViewProps(
  //     locationDs,
  //     orientationDs,
  //     { name: 'location' },
  //     vizwizStore.globalConfig,
  //   )
  //   const visualizationComponents = {
  //     // dataSource: [pmResult.pmDataSource, pmResult.orientationDataSource],
  //     dataSource: [pmResult.locationDataSource, pmResult.orientationDataSource],
  //     dataLayer: pmResult.mapLayer,
  //     dataView: pmResult.mapView,
  //   }
  //   const newViz: OSHVisualization = new OSHVisualization(
  //     `visualization-${randomUUID()}`,
  //     'test',
  //     'pmorientation',
  //     null,
  //     [locationDs, orientationDs],
  //     null,
  //   )
  //   newViz.setVisualizationComponents(visualizationComponents)
  //   visualizationStore.addVisualization(newViz)
  //   console.log('Created PM Orientation Visualization:', newViz)
  // }
}

/**
 * Creates properties for a Map View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedProperty
 * @param visOptions
 * @constructor
 */
export function CreateMapViewProps(
  datastreams: { [key: string]: any },
  visOptions: any,
) {
  const datastreamStore = useDataStreamStore()

  const vizDatasources: ISweApiDataSourceProperties[] = []

  // Iterate through each unique datastream ID
  for (const [dsId, entry] of Object.entries(datastreams)) {
    console.log('Processing datastream ID:', dsId, 'with entry:', entry)

    // Push new ISweApiDataSourceProperties
    const currentDataSource = datastreamStore.getDataStreamsById([dsId])
    vizDatasources.push({
      endpointUrl: currentDataSource[0].datastream.networkProperties.endpointUrl,
      resource: `/datastreams/${dsId}/observations`,
      tls: currentDataSource[0].datastream.networkProperties.tls,
      protocol: 'ws',
      startTime: visOptions.startTime || 'now',
      endTime: visOptions.endTime || '2125-08-01T00:00:00Z',
      mode: Mode.REAL_TIME, // TODO: Make configurable
      responseFormat: 'application/swe+json',
    })
    

    // Iterate through each role within the datastream entry
    for (const roleObj of entry) {
      const role = Object.keys(roleObj)[0]    // Get role name
      const dsEntry = roleObj[role]           // Get the properties for the role
      console.log('Processing role:', role, 'with dsEntry:', dsEntry)
    }

  }


  // // Build SweApiDataSourceProperties for LOCATION datastream
  // const locationDataSource: ISweApiDataSourceProperties = {
  //   endpointUrl: locationDs.datastream.networkProperties.endpointUrl,
  //   resource: `/datastreams/${locationDs.datastream.properties.id}/observations`,
  //   tls: locationDs.datastream.networkProperties.tls,
  //   protocol: 'ws',
  //   startTime: visOptions.startTime || 'now',
  //   endTime: visOptions.endTime || '2125-08-01T00:00:00Z',
  //   mode: Mode.REAL_TIME, // TODO: Make configurable
  //   responseFormat: 'application/swe+json',
  // }
  // // Build SweApiDataSourceProperties for ORIENTATION datastream
  // const orientationDataSource: ISweApiDataSourceProperties = {
  //   endpointUrl: orientationDs.datastream.networkProperties.endpointUrl,
  //   resource: `/datastreams/${orientationDs.datastream.properties.id}/observations`,
  //   tls: orientationDs.datastream.networkProperties.tls,
  //   protocol: 'ws',
  //   startTime: visOptions.startTime || 'now',
  //   endTime: visOptions.endTime || '2125-08-01T00:00:00Z',
  //   mode: Mode.REAL_TIME, // TODO: Make configurable
  //   responseFormat: 'application/swe+json',
  // }

  // // Build MapLayerProperties
  // const mapLayer: any = {
  //   dataSourceIds: [locationDs.id, orientationDs.id],
  //   markerColor: visOptions.markerColor || 'red',
  //   markerIcon: visOptions.markerIcon || undefined,
  //   name: `${randomUUID()} - PM Orientation Layer`,
  // }

  // // Build MapViewProperties
  // const mapView: IMapViewProperties = {
  //   container: `map-container-${randomUUID()}`,
  //   layers: [mapLayer],
  //   css: 'map-view',
  //   refreshRate: 1000,
  // }

  // return {
  //   locationDataSource,
  //   orientationDataSource,
  //   mapLayer,
  //   mapView,
  // }

  return
}










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
