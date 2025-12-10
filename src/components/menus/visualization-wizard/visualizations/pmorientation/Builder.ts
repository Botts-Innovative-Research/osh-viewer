import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs'
import {
  IMapLayerProperties,
  IMapViewProperties,
  ISweApiDataSourceProperties,
} from '@/lib/VisualizationHelpers'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { useVizWizStore } from '@/stores/vizwizstore'
import { Mode } from 'osh-js/source/core/datasource/Mode'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'

export function build() {
  console.log('Building PM Orientation Visualization...')
  const vizwizStore = useVizWizStore()
  const datastreams = vizwizStore.datastreams
  const visualizationStore = useVisualizationStore()

  let locationDs: OSHDatastream | undefined
  let orientationDs: OSHDatastream | undefined

  // Find Location & Orientation property datastreams
  for (const ds of datastreams) {
    console.log('Checking DS:', ds.name)
    console.log('DS Properties:', vizwizStore.dsConfig[ds.id])
    const config = vizwizStore.dsConfig[ds.id]
    if (config?.selectedProperties?.some((p: any) => p.name === 'location')) {
      locationDs = ds
      console.log('Location DS:', locationDs.name)
    } else if (config?.selectedProperties?.some((p: any) => p.name === 'orient')) {
      orientationDs = ds
      console.log('Orientation DS:', orientationDs.name)
    }
  }

  // if (locationDs && orientationDs) {
  if (locationDs && orientationDs) {
    console.log('Found locationDs and orientationDs, building visualization...')
    const pmResult = CreateMapViewProps(
      locationDs,
      orientationDs,
      { name: 'location' },
      vizwizStore.globalConfig,
    )
    const visualizationComponents = {
      // dataSource: [pmResult.pmDataSource, pmResult.orientationDataSource],
      dataSource: [pmResult.locationDataSource, pmResult.orientationDataSource],
      dataLayer: pmResult.mapLayer,
      dataView: pmResult.mapView,
    }
    const newViz: OSHVisualization = new OSHVisualization(
      `visualization-${randomUUID()}`,
      'test',
      'pmorientation',
      null,
      [locationDs, orientationDs],
      null,
    )
    newViz.setVisualizationComponents(visualizationComponents)
    visualizationStore.addVisualization(newViz)
    console.log('Created PM Orientation Visualization:', newViz)
  }
}

/**
 * Creates properties for a Map View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedProperty
 * @param visOptions
 * @constructor
 */
export function CreateMapViewProps(
  locationDs: OSHDatastream,
  orientationDs: OSHDatastream,
  selectedProperty: any,
  visOptions: any,
) {
  // Build SweApiDataSourceProperties for LOCATION datastream
  const locationDataSource: ISweApiDataSourceProperties = {
    endpointUrl: locationDs.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${locationDs.datastream.properties.id}/observations`,
    tls: locationDs.datastream.networkProperties.tls,
    protocol: 'ws',
    startTime: visOptions.startTime || 'now',
    endTime: visOptions.endTime || '2125-08-01T00:00:00Z',
    mode: Mode.REAL_TIME, // TODO: Make configurable
    responseFormat: 'application/swe+json',
  }
  // Build SweApiDataSourceProperties for ORIENTATION datastream
  const orientationDataSource: ISweApiDataSourceProperties = {
    endpointUrl: orientationDs.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${orientationDs.datastream.properties.id}/observations`,
    tls: orientationDs.datastream.networkProperties.tls,
    protocol: 'ws',
    startTime: visOptions.startTime || 'now',
    endTime: visOptions.endTime || '2125-08-01T00:00:00Z',
    mode: Mode.REAL_TIME, // TODO: Make configurable
    responseFormat: 'application/swe+json',
  }

  // Build MapLayerProperties
  const mapLayer: any = {
    dataSourceIds: [locationDs.id, orientationDs.id],
    markerColor: visOptions.markerColor || 'red',
    markerIcon: visOptions.markerIcon || undefined,
    name: `${randomUUID()} - PM Orientation Layer`,
  }

  // Build MapViewProperties
  const mapView: IMapViewProperties = {
    container: `map-container-${randomUUID()}`,
    layers: [mapLayer],
    css: 'map-view',
    refreshRate: 1000,
  }

  return {
    locationDataSource,
    orientationDataSource,
    mapLayer,
    mapView,
  }
}
