import {useVisualizationStore} from "@/stores/visualizationstore";
import {useVizWizStore} from "@/stores/vizwizstore";
import {AggregateDatastreams, BuildRoleProperty, getUsedDatastreams} from "../../shared/helpers";
//@ts-ignore
import {useDataStreamStore} from "@/stores/datastreamstore";
import {IChartViewProperties, ICurveLayerProperties, ISweApiDataSourceProperties, VisualizationComponents} from "@/lib/VisualizationHelpers";
//@ts-ignore
import {Mode} from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ChartDescriptor } from "./Descriptor";

export default function build() {
	console.log('Building Chart Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams();

	const chartResult = CreateChartViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: chartResult.vizDatasources,
		dataLayer: chartResult.curveLayer,
		dataView: chartResult.chartView,
	};

	console.log(vizwizStore.id);

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'chart',
		ChartDescriptor.viewLocation,
		getUsedDatastreams()
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Chart Visualization:', newViz);
}

export function CreateChartViewProps(datastreams: { [key: string]: any }, visOptions: any) {
    const vizwizStore = useVizWizStore();
    const datastreamStore = useDataStreamStore();

    // Create datasources, layer, and view
    const vizDatasources: ISweApiDataSourceProperties[] = [];
    let curveLayer: ICurveLayerProperties = {
        name: vizwizStore.dsConfig['y'].label + (vizwizStore.dsConfig['y'].uom ? ` (${vizwizStore.dsConfig['y'].uom})` : '') || 'Y-Axis Data',
        maxValues: 1000,
        lineColor: visOptions.lineColor || '#FF0000',
        backgroundColor: visOptions.backgroundColor || '#FFFFFF',
        fill: true,
        getCurveId: (rec: any, timestamp: any) => '2',
        xLabel: vizwizStore.dsConfig['x'].label != null ? vizwizStore.dsConfig['x'].label : 'X-Axis Data',
        yLabel: vizwizStore.dsConfig['y'].label + (vizwizStore.dsConfig['y'].uom ? ` (${vizwizStore.dsConfig['y'].uom})` : '') || 'Y-Axis Data',
        getValues: (rec: any, timestamp: any) => {
            return {
                x: rec[vizwizStore.dsConfig['x'].property || rec.timestamp],
                y: rec[vizwizStore.dsConfig['y'].property || ''],
            }
        },
    }
    let chartView: IChartViewProperties = {
        container: `chart-container-${randomUUID()}`,
        css: 'chart-view',
        layers: [curveLayer],
        datasetOptions: { tension: 0.2 },
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
    }

    console.log('Created ChartViewProps:', {vizDatasources, curveLayer, chartView});

    return {
        vizDatasources,
        curveLayer,
        chartView,
    };
}