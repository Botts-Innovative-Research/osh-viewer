import { OSHControlStream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { MissionDescriptor } from './Descriptor';
import { MiniMapDescriptor } from '../minimap/Descriptor';
import { PointMarkerDescriptor } from '../pointmarker/Descriptor';
import {
	AggregateControlstreams,
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedControlstreams,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import {
	IConSysApiControlStreamProperties,
	IConSysApiDataSourceProperties,
} from '../../types/datasource';
import { CreateMiniMapVizProps } from '../minimap/Builder';
import { CreatePointMarkerVizProps } from '../pointmarker/Builder';
import { iconPathBuilder } from '@/lib/icons';

export default async function build() {
	console.log('Building Mission Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

    const vizName = vizwizStore.visualizationCustomizationOptions.name;

    const children: OSHVisualization[] = [];

    const datastreams = AggregateDatastreams(vizwizStore.dsConfig);
	const controlstreams = AggregateControlstreams(vizwizStore.csConfig);

	const missionResult = CreateMissionVizProps(datastreams, controlstreams);

	const missionVisualizationComponents: VisualizationComponents = {
		dataSource: missionResult.vizDatasources,
		dataLayer: [],
		controlstream: missionResult.vizControlstreams,
	};

	const minimapResult = CreateMiniMapVizProps(datastreams);
	const minimapVisualizationComponents: VisualizationComponents = {
		dataSource: minimapResult.vizDatasources,
		dataLayer: [],
		controlstream: [],
	};
	const minimapViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		`${vizwizStore.visualizationCustomizationOptions.name} - Mini Map`,
		'minimap',
		MiniMapDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		[]
	);
	minimapViz.setVisualizationComponents(minimapVisualizationComponents);
    children.push(minimapViz);


	if (vizwizStore.dsConfig.homeLocation?.selected) {
        const homeDatastreams = AggregateDatastreams({ location: vizwizStore.dsConfig.homeLocation });
        const pmResult = await CreatePointMarkerVizProps(homeDatastreams, {
            name: vizwizStore.visualizationCustomizationOptions.name,
            icon: vizwizStore.visualizationCustomizationOptions.homeIcon,
            iconColor: vizwizStore.visualizationCustomizationOptions.homeIconColor,
            iconName: vizwizStore.visualizationCustomizationOptions.pmIconName,
        });
        const pmVisualizationComponents: VisualizationComponents = {
            dataSource: pmResult.vizDatasources,
            dataLayer: pmResult.pointMarkerLayer,
        };
        const pmViz: OSHVisualization = new OSHVisualization(
            `${vizwizStore.id}-${randomUUID()}`,
            `${vizwizStore.visualizationCustomizationOptions.name} - Home`,
            'pointmarker',
            PointMarkerDescriptor.viewLocation,
            getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
            undefined,
            vizwizStore.id
        );
        pmViz.setVisualizationComponents(pmVisualizationComponents);
        visualizationStore.addVisualization(pmViz);
		children.push(pmViz);
	}

	if (vizwizStore.dsConfig.location?.selected) {
		const locationDatastreams = AggregateDatastreams({ location: vizwizStore.dsConfig.location });
        const pmResult = await CreatePointMarkerVizProps(locationDatastreams, {
            name: vizwizStore.visualizationCustomizationOptions.name,
            icon: vizwizStore.visualizationCustomizationOptions.locationIcon,
            iconColor: vizwizStore.visualizationCustomizationOptions.locationIconColor,
            iconName: vizwizStore.visualizationCustomizationOptions.pmIconName,
        });
        const pmVisualizationComponents: VisualizationComponents = {
            dataSource: pmResult.vizDatasources,
            dataLayer: pmResult.pointMarkerLayer,
        };
        const pmViz: OSHVisualization = new OSHVisualization(
            `${vizwizStore.id}-${randomUUID()}`,
            `${vizwizStore.visualizationCustomizationOptions.name} - Location`,
            'pointmarker',
            PointMarkerDescriptor.viewLocation,
            getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
            undefined,
            vizwizStore.id
        );
        pmViz.setVisualizationComponents(pmVisualizationComponents);
        visualizationStore.addVisualization(pmViz);
        children.push(pmViz);
    }
	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizName,
		'mission',
		MissionDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		getUsedControlstreams(vizwizStore.controlstreams, vizwizStore.csConfig)
	);
	newViz.setVisualizationComponents(missionVisualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig());
	newViz.addChildVisualization(children);
	visualizationStore.addVisualization(newViz);
	console.log('Created Mission Visualization:', newViz);
}

export function CreateMissionVizProps(
	datastreams: { [key: string]: any },
	controlstreams: { [key: string]: any }
) {
	const controlstreamStore = useControlStreamStore();
	const datastreamStore = useDataStreamStore();

	const vizControlstreams: IConSysApiControlStreamProperties[] = [];
	const vizDatastreams: IConSysApiDataSourceProperties[] = [];

	for (const [dsId, entry] of Object.entries(datastreams)) {
		const properties = BuildRoleProperty(entry);

		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);

		const currentDatastream: IConSysApiDataSourceProperties = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: currentOSHDatastream[0].id,
			properties: properties,
			connectorOpts: {
				username:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password,
			},
		};
		vizDatastreams.push(currentDatastream);
	}
	for (const [csId, entry] of Object.entries(controlstreams)) {
		const properties = BuildRoleProperty(entry);

		const currentOSHControlstream: OSHControlStream = controlstreamStore.getControlStreamsById([
			csId,
		])[0];
		const currentControlstream: IConSysApiControlStreamProperties = {
			endpointUrl: currentOSHControlstream.controlstream.networkProperties.endpointUrl,
			tls: currentOSHControlstream.controlstream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: currentOSHControlstream.id,
			properties: properties,
			connectorOpts: {
				username:
					currentOSHControlstream.controlstream.networkProperties.connectorOpts.username,
				password:
					currentOSHControlstream.controlstream.networkProperties.connectorOpts.password,
			},
		};
		vizControlstreams.push(currentControlstream);
	}

	return {
		vizDatasources: vizDatastreams,
		vizControlstreams: vizControlstreams,
	};
}
