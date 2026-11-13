import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
// @ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { SdrDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedControlstreams,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import { ISdrCustomizationOptions } from '../../types/customization';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { ISdrViewProperties } from '../../types/views';

export default function build() {
	console.log('Building SDR Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const sdrResult = CreateSdrVizProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);

	const visualizationComponents: VisualizationComponents = {
		dataSource: sdrResult.vizDatasources,
		dataLayer: null,
		dataView: sdrResult.sdrView,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name || 'SDR Spectrum',
		'sdr',
		SdrDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		getUsedControlstreams(vizwizStore.controlstreams, vizwizStore.csConfig)
	);

	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig());
	visualizationStore.addVisualization(newViz);
	console.log('Created SDR Visualization:', newViz);
}

export function CreateSdrVizProps(
	datastreams: { [key: string]: any },
	visOptions: ISdrCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();
	const vizwizStore = useVizWizStore();

	const vizDatasources: IConSysApiDataSourceProperties[] = [];

	const sdrView: ISdrViewProperties & { roles?: any } = {
		container: `sdr-container-${randomUUID()}`,
		css: 'sdr-view',
		layers: null,
		autoDb: visOptions?.autoDb ?? true,
		minDb: visOptions?.minDb ?? -100,
		maxDb: visOptions?.maxDb ?? -20,
		averaging: visOptions?.averaging ?? 2,
		waterfall: visOptions?.waterfall ?? true,
		waterfallSpeed: visOptions?.waterfallSpeed ?? 2,
		colorPalette: visOptions?.colorPalette ?? 'heat',
		roles: {
			amplitude: (() => {
				const prop = Array.isArray(vizwizStore.dsConfig?.amplitude?.property)
					? vizwizStore.dsConfig.amplitude.property[0]
					: vizwizStore.dsConfig?.amplitude?.property;
				if (!prop || String(prop).toLowerCase().includes('time')) return 'amplitude';
				return prop;
			})(),
			amplitudeOutputName: vizwizStore.dsConfig?.amplitude?.outputName ?? 'rtlsdr_spectrum',
			centerFrequency: (() => {
				const prop = Array.isArray(vizwizStore.dsConfig?.centerFrequency?.property)
					? vizwizStore.dsConfig.centerFrequency.property[0]
					: vizwizStore.dsConfig?.centerFrequency?.property;
				if (!prop || String(prop).toLowerCase().includes('count')) return 'center_frequency';
				return prop;
			})(),
			frequencyAxis: Array.isArray(vizwizStore.dsConfig?.frequencyAxis?.property)
				? vizwizStore.dsConfig.frequencyAxis.property[0]
				: vizwizStore.dsConfig?.frequencyAxis?.property ?? 'frequency_axis',
			sampleRate: Array.isArray(vizwizStore.dsConfig?.sampleRate?.property)
				? vizwizStore.dsConfig.sampleRate.property[0]
				: vizwizStore.dsConfig?.sampleRate?.property ?? 'sampleRate',
		},
	};

	let targetEntries = Object.entries(datastreams);
	if (targetEntries.length === 0) {
		const allStreams = datastreamStore.dataStreams || [];
		const spectrumStream = allStreams.find((d: any) => {
			const o = (d.datastream?.properties?.outputName || '').toLowerCase();
			const n = (d.name || '').toLowerCase();
			return o.includes('spectrum') || n.includes('spectrum') || o.includes('rtlsdr_spectrum');
		});
		if (spectrumStream) {
			targetEntries = [[spectrumStream.id, { amplitude: { property: 'amplitude', selected: true } }]];
		}
	}

	for (const [dsId, entry] of targetEntries) {
		const properties = BuildRoleProperty(entry);
		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);

		if (!currentOSHDatastream || currentOSHDatastream.length === 0) continue;

		const supportedFormats = currentOSHDatastream[0].datastream.properties?.formats || [];
		const chosenFormat =
			supportedFormats.find((f: string) => f.includes('application/om+json')) ||
			supportedFormats.find((f: string) => f.includes('application/swe+json')) ||
			supportedFormats[0] ||
			'application/om+json';

		const currentDataSource: IConSysApiDataSourceProperties & { datastreamId: string } = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: chosenFormat,
			id: randomUUID(),
			datastreamId: dsId,
			properties: properties,

			connectorOpts: {
				username:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts?.username || 'admin',
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts?.password || 'test',
			},
		};
		vizDatasources.push(currentDataSource);
	}

	return {
		vizDatasources,
		sdrView,
	};
}
