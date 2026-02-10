import {useVisualizationStore} from "@/stores/visualizationstore";
import {useVizWizStore} from "@/stores/vizwizstore";
import {AggregateDatastreams, BuildRoleProperty} from "../../shared/helpers";
import {randomUUID} from 'osh-js/source/core/utils/Utils.js';
import {useDataStreamStore} from "@/stores/datastreamstore";
import {ISweApiDataSourceProperties, VisualizationComponents} from "@/lib/VisualizationHelpers";
import {Mode} from 'osh-js/source/core/datasource/Mode';
import {OSHVisualization} from "@/lib/OSHConnectDataStructs";

export function build() {
    console.log('Building Chart Visualization...');
    const vizwizStore = useVizWizStore();
    const visualizationStore = useVisualizationStore();

    const datastreams = AggregateDatastreams();
    console.log('Aggregated datastreams for PM Orientation:', datastreams);

    const chartResult = CreateChartViewProps(datastreams, vizwizStore.visualizationCustomizationOptions);

    const visualizationComponents: VisualizationComponents = {
        dataSource: chartResult.vizDatasources,
        dataLayer: chartResult.curveLayer,
        dataView: chartResult.chartView,
    };

    const newViz: OSHVisualization = new OSHVisualization(
        `visualization-${randomUUID()}`,
        vizwizStore.visualizationCustomizationOptions.name,
        'chart',
        null,
        datastreams,
        null
    );
    newViz.setVisualizationComponents(visualizationComponents);
    visualizationStore.addVisualization(newViz);
    console.log('Created Chart Visualization:', newViz);
}

export function CreateChartViewProps(datastreams: { [key: string]: any }, visOptions: any) {
    const vizwizStore = useVizWizStore();
    const datastreamStore = useDataStreamStore();

    const vizDatasources: ISweApiDataSourceProperties[] = [];
    let curveLayer: any = {
        fill: true,
        maxValues: 1000,
    }

    let chartView: any = {
        container: `chart-container-${randomUUID()}`,
        css: 'chart-view',
        datasetOptions: {
            tension: 0.2,
        },
        refreshRate: 1000,
    }

    for (const [dsId, entry] of Object.entries(datastreams)) {
        const properties = BuildRoleProperty(entry);

        const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);
        const currentDataSource: ISweApiDataSourceProperties = {
            endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
            resource: `/datastreams/${dsId}/observations`,
            tls: currentOSHDatastream[0].datastream.networkProperties.tls,
            protocol: 'ws',
            startTime: 'now',
            endTime: '2125-08-01T00:00:00Z',
            mode: Mode.REAL_TIME,
            responseFormat: 'application/swe+json',
            id: randomUUID(),
            properties: properties,
            connectorOpts: {
                username: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
                password: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password
            }
        };
        vizDatasources.push(currentDataSource);

        curveLayer = {
            ...curveLayer,
            dataSourceIds: vizDatasources.map(ds => ds.id),
            getValues: (rec: any, timestamp: any) => {
                return {
                    x: rec[vizwizStore.dsConfig['x'].property || rec.timestamp],
                    y: rec[vizwizStore.dsConfig['y'].property || ''],
                }
            },
            lineColor: visOptions.lineColor || '#FF0000',
            backgroundColor: visOptions.backgroundColor || '#FFFFFF',
            getCurveId: (rec: any, timestamp: any) => '2',
            name: vizwizStore.dsConfig['y'].label + (vizwizStore.dsConfig['y'].uom ? ` (${vizwizStore.dsConfig['y'].uom})` : '') || 'Y-Axis Data',
            xLabel: vizwizStore.dsConfig['x'].label != null ? vizwizStore.dsConfig['x'].label : 'X-Axis Data',
            yLabel: vizwizStore.dsConfig['y'].label + (vizwizStore.dsConfig['y'].uom ? ` (${vizwizStore.dsConfig['y'].uom})` : '') || 'Y-Axis Data',
        }

        chartView = {
            ...chartView,
            layers: [curveLayer],
        }

        console.log('Created ChartViewProps:', {vizDatasources, curveLayer, chartView});
    }

    return {
        vizDatasources,
        curveLayer,
        chartView,
    };
}