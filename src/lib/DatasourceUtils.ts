import { useUIStore } from '@/stores/uistore'
import DataStreamFilter from 'osh-js/source/core/sweapi/datastream/DataStreamFilter'
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js'
import { Mode } from 'osh-js/source/core/datasource/Mode'
import ChartJsView from 'osh-js/source/core/ui/view/chart/ChartJsView.js'
import CurveLayer from 'osh-js/source/core/ui/layer/CurveLayer.js'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import { OSHDatastream } from '@/lib/OSHConnectDataStructs'
import { IChartViewProperties, ICurveLayerProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers'


export function mineDatasourceObsProps(): {ds: any, observedProps: any} {

  const uiStore = useUIStore()
  const ds = uiStore.selectedDatastream

  if (!ds) {
    console.warn('No datastream selected');
  }

  const observedProps = ds.datastream.properties?.observedProperties || []
  console.log('[DS-Utils] Observed Properties:', observedProps)

  // fetchSchema(ds.datastream);

  return { ds, observedProps };
}

export function checkDSForProp(propName: string, observedProps: any): any {
  for(const prop of observedProps) {
    if (prop.definition.includes(propName)) {
      console.log(`[DS-Utils] Found property: ${propName}`);
      return prop;
    }
  }

  return false;
}

export function checkDSForProps(propNames: string[], observedProps: any): any {
  let results: any = {};

  for (const propName of propNames) {
    const res = checkDSForProp(propName, observedProps);
    if (res !== false) {
      results[propName] = res;
    }
  }

  if (Object.keys(results).length === 0) {
    return false;
  } else {
    return results;
  }
}

export async function fetchSchema(datastream: any) {
  console.log('[DatasourceUtils] Fetching schema for datastream:', datastream)

  let checkedFormat = datastream.properties.formats.filter((format: any) => format.includes('application/swe+json') || format.includes('application/swe+binary'))

  if (!checkedFormat) {
    checkedFormat = ['application/om+json'] // Fallback to om+json which should be available always
  }

  let filter = new DataStreamFilter({ obsFormat: checkedFormat[0] })
  return datastream.getSchema(filter)
    .then((schemaRes: any) => {
      if (schemaRes) {
        console.log('[DatasourceUtils] Schema fetched:', schemaRes)
        return schemaRes
      }
    }).catch((error: any) => {
      console.error('[DatasourceUtils] Error fetching schema:', error)
      return null
    })
}

export function matchPropAndSchema(observedProp: any, schema: any[]): any {
  let matchedProps: any = {};

  schema.filter((schemaEntry: any) => {
    if (schemaEntry.definition.includes(observedProp.definition)) {
      matchedProps[observedProp.definition] = {
        observedProperty: observedProp,
        schemaEntry: schemaEntry
      };
      return schemaEntry;
    }
    return false;
  })

  return matchedProps;
}


export class VisualizationMetadata {
  id: string;
  type: string;
  datastreamId: string;
  observedProperty: string;

  constructor(id: string, type: string, datastreamId: string, observedProperty: string) {
    this.id = id;
    this.type = type;
    this.datastreamId = datastreamId;
    this.observedProperty = observedProperty;
  }
}

export class SchemaFieldProperty {
  definition: string;
  name: string;
  type: string;
  referenceFrame?: string;
  uom?: any;

  constructor(definition: string, name: string, type: string, unitOfMeasure?: string) {
    this.definition = definition;
    this.name = name;
    this.type = type;
    this.uom = unitOfMeasure;
  }
}

export function CreateChartView(ds: OSHDatastream, selectedProperty: any): any {
  console.log('[DatasourceUtils] Creating Chart View for Datastream:', OSHDatastream)
  // const ds = OSHDatastream.datastream;
  console.log('[DatasourceUtils] Creating Chart View for Datastream:', ds)
  // create a datastruct for DataSource props
  const dataSource = new SweApi(ds.name, {
    endpointUrl: ds.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${ds.datastream.properties.id}/observations`,
    tls: false,
    protocol: 'ws',
    startTime: 'now',
    endTime: '2025-08-01T00:00:00Z',
    mode: Mode.REAL_TIME,
    responseFormat: 'application/swe+json'
  })

  // TODO: create datastruct for chart options
  const chartLayer = new CurveLayer({
    maxValues: 1000,
    dataSourceId: dataSource.id,
    getValues: (rec: any, timestamp: any) => {
      console.log(`getValues called for record:`, rec)
      return {
        x: rec.timestamp,
        y: rec[selectedProperty.name]
      }
    },
    lineColor: 'rgba(0,220,204,0.5)',
    backgroundColor: 'rgba(49,47,47,0.64)',
    fill: true,
    getCurveId: (rec: any, timestamp: any) => 2,
    name: `${selectedProperty.label} (${selectedProperty.uom.code})`
  })

  // TODO: make sure that Chart.vue is using this id
  const chartView = new ChartJsView({
    container: `chart-container-${randomUUID()}`,
    layers: [chartLayer],
    css: 'chart-view',
    datasetOptions: {
      tension: 0.2 // for 'line'
    },
    refreshRate: 1000
  })

  console.log('[DatasourceUtils] Created Chart View with DataSource:', dataSource)
  console.log('[DatasourceUtils] Chart Layer:', chartLayer)
  console.log('[DatasourceUtils] Chart View:', chartView)

  return {
    dataSource: dataSource,
    chartLayer: chartLayer,
    chartView: chartView
  }

}

export function CreateChartViewProps(ds: OSHDatastream, selectedProperty: any): {
  dataSource: ISweApiDataSourceProperties,
  chartLayer: ICurveLayerProperties,
  chartView: IChartViewProperties
} {
  // Build SweApiDataSourceProperties
  const dataSource: ISweApiDataSourceProperties = {
    endpointUrl: ds.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${ds.datastream.properties.id}/observations`,
    tls: false,
    protocol: 'ws',
    startTime: 'now',
    endTime: '2025-08-01T00:00:00Z',
    mode: Mode.REAL_TIME,
    responseFormat: 'application/swe+json'
  }

  // Build CurveLayerProperties
  const chartLayer: ICurveLayerProperties = {
    maxValues: 1000,
    dataSourceId: ds.datastream.properties.id,
    getValues: (rec: any, timestamp: any) => {
      return {
        x: rec.timestamp,
        y: rec[selectedProperty.name]
      }
    },
    lineColor: 'rgba(0,220,204,0.5)',
    backgroundColor: 'rgba(49,47,47,0.64)',
    fill: true,
    getCurveId: (rec: any, timestamp: any) => '2',
    name: `${selectedProperty.label} (${selectedProperty.uom.code})`
  }

  // Build ChartViewProperties
  const chartView: IChartViewProperties = {
    container: `chart-container-${randomUUID()}`,
    layers: [chartLayer],
    css: 'chart-view',
    datasetOptions: {
      tension: 0.2
    },
    refreshRate: 1000
  }

  return {
    dataSource,
    chartLayer,
    chartView
  }
}
