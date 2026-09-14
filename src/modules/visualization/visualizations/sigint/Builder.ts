import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateDatastreams, getUsedDatastreams } from '../../services/aggregation.service';
import { PointMarkerDescriptor } from '../pointmarker/Descriptor';
import { LobDescriptor } from '../lob/Descriptor';
import { EllipseConfigRoles, EllipseDescriptor } from '../ellipse/Descriptor';
import { SigIntDescriptor } from './Descriptor';
import { VisualizationComponents } from '../../types/visualization';
import { CreatePointMarkerVizProps } from '../pointmarker/Builder';
import { CreateLobVizProps } from '../lob/Builder';
import { CreateEllipseVizProps } from '../ellipse/Builder';
import { confirmRoles } from '../../registry/roleUtils';

export default async function build() {
	console.log('Building Sigint Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	let components: VisualizationComponents[] = [];
	let children: OSHVisualization[] = [];

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	// POINTMARKER
	const pmResult = await CreatePointMarkerVizProps(datastreams, {
		name: vizwizStore.visualizationCustomizationOptions.name,
		icon: vizwizStore.visualizationCustomizationOptions.pmIcon,
		iconColor: vizwizStore.visualizationCustomizationOptions.pmIconColor,
		iconName: vizwizStore.visualizationCustomizationOptions.pmIconName,
	});
	const pmVisualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.pointMarkerLayer,
	};
	const pmViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		`${vizwizStore.visualizationCustomizationOptions.name} - Point Marker`,
		'pointmarker',
		PointMarkerDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		undefined,
		vizwizStore.id
	);
	pmViz.setVisualizationComponents(pmVisualizationComponents);
	visualizationStore.addVisualization(pmViz);
	components.push(pmVisualizationComponents);
	children.push(pmViz);

	// LOB
	const lobResult = CreateLobVizProps(datastreams, {
		name: vizwizStore.visualizationCustomizationOptions.name,
		lineColor: vizwizStore.visualizationCustomizationOptions.lobLineColor,
		lobWeight: vizwizStore.visualizationCustomizationOptions.lobWeight,
		lobOpacity: vizwizStore.visualizationCustomizationOptions.lobOpacity,
		lobDistanceKm: vizwizStore.visualizationCustomizationOptions.lobDistanceKm,
		icon: vizwizStore.visualizationCustomizationOptions.lobIcon,
		iconColor: vizwizStore.visualizationCustomizationOptions.lobIconColor,
		iconName: vizwizStore.visualizationCustomizationOptions.lobIconName,
		showIcon: vizwizStore.visualizationCustomizationOptions.showLobIcon,
	});
	const lobVisualizationComponents = {
		dataSource: lobResult.vizDatasources,
		dataLayer: lobResult.lobLayer,
	};
	const lobViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		`${vizwizStore.visualizationCustomizationOptions.name} - LoB`,
		'lob',
		LobDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		undefined,
		vizwizStore.id
	);
	lobViz.setVisualizationComponents(lobVisualizationComponents);
	visualizationStore.addVisualization(lobViz);
	components.push(lobVisualizationComponents);
	children.push(lobViz);

	// ELLIPSE - OPTIONAL
	// Check if it contains the required properties to determine whether it should be built or not
	if (confirmRoles(EllipseConfigRoles, vizwizStore.dsConfig)) {
		const ellipseResult = CreateEllipseVizProps(datastreams, {
			name: vizwizStore.visualizationCustomizationOptions.name,
			ellipseColor: vizwizStore.visualizationCustomizationOptions.ellipseColor,
		});
		const ellipseVisualizationComponents = {
			dataSource: ellipseResult.vizDatasources,
			dataLayer: ellipseResult.ellipseLayer,
		};
		const ellipseViz = new OSHVisualization(
			`${vizwizStore.id}-${randomUUID()}`,
			`${vizwizStore.visualizationCustomizationOptions.name} - Ellipse`,
			'ellipse',
			EllipseDescriptor.viewLocation,
			getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
			undefined,
			vizwizStore.id
		);
		ellipseViz.setVisualizationComponents(ellipseVisualizationComponents);
		visualizationStore.addVisualization(ellipseViz);
		components.push(ellipseVisualizationComponents);
		children.push(ellipseViz);
	}

	console.log(components, children);

	// FULL SIGINT VIZ
	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'sigint',
		SigIntDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	newViz.setVisualizationComponents(components);
	newViz.addChildVisualization(children);
	visualizationStore.addVisualization(newViz);
	console.log('Created SigInt Visualization:', newViz);
}
