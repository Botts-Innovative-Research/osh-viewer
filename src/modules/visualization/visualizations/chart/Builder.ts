import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { useDataStreamStore } from '@/stores/datastreamstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ChartDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import { IChartCustomizationOptions } from '../../types/customization';
import { ISweApiDataSourceProperties } from '../../types/datasource';
import { ICurveLayerProperties } from '../../types/layers';
import { IChartViewProperties } from '../../types/views';

export default function build() {
	console.log('Building Chart Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const chartResult = CreateChartViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: chartResult.vizDatasources,
		dataLayer: chartResult.curveLayers,
		dataView: chartResult.chartView,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'chart',
		ChartDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Chart Visualization:', newViz);
}

export function CreateChartViewProps(
	datastreams: { [key: string]: any },
	visOptions: IChartCustomizationOptions
) {
	const vizwizStore = useVizWizStore();
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let curveLayers: ICurveLayerProperties[] = [];

	// Handle multiple Y properties (for multiple curves)
	const yProperties = Array.isArray(vizwizStore.dsConfig['y'].property)
		? vizwizStore.dsConfig['y'].property
		: [vizwizStore.dsConfig['y'].property];
	const yLabels = Array.isArray(vizwizStore.dsConfig['y'].label)
		? vizwizStore.dsConfig['y'].label
		: [vizwizStore.dsConfig['y'].label];
	const yUoms = Array.isArray(vizwizStore.dsConfig['y'].uom)
		? vizwizStore.dsConfig['y'].uom
		: [vizwizStore.dsConfig['y'].uom];

	for (let i = 0; i < yProperties.length; i++) {
		curveLayers.push({
			name: yLabels[i] + (yUoms[i] ? ` (${yUoms[i]})` : '') || `Y-Axis Data ${i + 1}`,
			maxValues: 1000,
			lineColor: visOptions.lineColor[yProperties[i]] || '#FF0000',
			backgroundColor: visOptions.backgroundColor[yProperties[i]] || '#FF000000',
			fill: true,
			xLabel:
				vizwizStore.dsConfig['x'].label != null
					? vizwizStore.dsConfig['x'].label
					: 'X-Axis Data',
			yLabel: yLabels[i] + (yUoms[i] ? ` (${yUoms[i]})` : '') || `Y-Axis Data ${i + 1}`,
			curveId: `curve-${i}`,
			values: {
				x: {
					outputName: vizwizStore.dsConfig['x'].outputName,
					property: vizwizStore.dsConfig['x'].property,
				},
				y: { outputName: vizwizStore.dsConfig['y'].outputName, property: yProperties[i] },
			},
		});
	}

	let chartView: IChartViewProperties = {
		container: `chart-container-${randomUUID()}`,
		css: 'chart-view',
		layers: curveLayers,
		datasetOptions: { tension: 0.2 },
		refreshRate: 1000,
	};

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
				username:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password,
			},
		};
		vizDatasources.push(currentDataSource);
	}

	console.log('Created ChartViewProps:', { vizDatasources, curveLayers, chartView });

	return {
		vizDatasources,
		curveLayers,
		chartView,
	};
}
