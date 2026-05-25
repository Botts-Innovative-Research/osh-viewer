import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { VisualizationComponents } from '@/lib/VisualizationHelpers';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateDatastreams, getUsedDatastreams } from '../../services/aggregation.service';
import { CreatePointMarkerViewProps } from '../pointmarker/Builder';
import { CreateLobViewProps } from '../lob/Builder';
import { CreateEllipseViewProps } from '../ellipse/Builder';
import { PointMarkerDescriptor } from '../pointmarker/Descriptor';
import { LobDescriptor } from '../lob/Descriptor';
import { EllipseDescriptor } from '../ellipse/Descriptor';
import { BeastkitDescriptor } from './Descriptor';

export default function build() {
	console.log('Building Beastkit Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	// POINTMARKER
	const pmResult = CreatePointMarkerViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const pmVisualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.pointMarkerLayer,
		dataView: pmResult.mapView,
	};
	const pmViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name,
		'pointmarker',
		PointMarkerDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	pmViz.setVisualizationComponents(pmVisualizationComponents);
	// LOB
	const lobResult = CreateLobViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const lobVisualizationComponents = {
		dataSource: lobResult.vizDatasources,
		dataLayer: lobResult.lobLayer,
		dataView: lobResult.lobView,
	};
	const lobViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name,
		'lob',
		LobDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	lobViz.setVisualizationComponents(lobVisualizationComponents);
	// ELLIPSE
	const ellipseResult = CreateEllipseViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const ellipseVisualizationComponents: VisualizationComponents = {
		dataSource: ellipseResult.vizDatasources,
		dataLayer: ellipseResult.ellipseLayer,
		dataView: ellipseResult.mapView,
	};
	const ellipseViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name,
		'ellipse',
		EllipseDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	ellipseViz.setVisualizationComponents(ellipseVisualizationComponents);

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'beastkit',
		BeastkitDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	newViz.setVisualizationComponents([
		pmVisualizationComponents,
		lobVisualizationComponents,
		ellipseVisualizationComponents,
	]);
	newViz.addChildVisualization([pmViz, lobViz, ellipseViz]);
	console.log(newViz);
	visualizationStore.addVisualization(newViz);

	// visualizationStore.addVisualization(pmViz);
	// visualizationStore.addVisualization(lobViz);
	// visualizationStore.addVisualization(ellipseViz);

	console.log('Created Beastkit Visualization:', newViz);
}
