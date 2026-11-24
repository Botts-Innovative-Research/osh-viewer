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
import { ISdrLayerProperties } from '../../types/layers';
import { ISdrViewProperties } from '../../types/views';

// The spectrum roles of the osh-js SdrLayer, mapped to a record field by the wizard. Any role
// left unmapped is detected from the record by the layer itself
const SDR_LAYER_ROLES = [
	'amplitude',
	'centerFrequency',
	'frequencyAxis',
	'sampleRate',
	'startFrequency',
	'stopFrequency',
	'audio',
];

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
		dataLayer: sdrResult.sdrLayer,
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

	// only the roles the user actually mapped are given to the layer, so that the ones left out
	// fall back to the field detection of the SdrLayer instead of to a guessed field name
	const roles: { [role: string]: string } = {};
	for (const role of SDR_LAYER_ROLES) {
		const entry = vizwizStore.dsConfig?.[role];
		if (entry?.selected && entry?.property) {
			roles[role] = entry.property;
		}
	}

	const sdrLayer: ISdrLayerProperties = {
		name: visOptions?.name || 'RF Spectrum',
		roles: roles,
	};

	const sdrView: ISdrViewProperties = {
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
		// the demodulated audio is carried by the observations of the audio datastream, so the
		// listening controls are only offered when one was mapped
		showAudioControls: roles.audio !== undefined,
	};

	for (const [dsId, entry] of Object.entries(datastreams)) {
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
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts?.username ?? '',
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts?.password ?? '',
			},
		};
		vizDatasources.push(currentDataSource);
	}

	return {
		vizDatasources,
		sdrLayer,
		sdrView,
	};
}
