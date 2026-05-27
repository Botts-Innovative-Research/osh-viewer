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
	const pmResult = CreatePointMarkerViewProps(datastreams, {
		name: vizwizStore.visualizationCustomizationOptions.name,
		icon: vizwizStore.visualizationCustomizationOptions.pmIcon,
		iconColor: vizwizStore.visualizationCustomizationOptions.pmIconColor,
		iconName: vizwizStore.visualizationCustomizationOptions.pmIconName,
	});
	const pmVisualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.pointMarkerLayer,
		dataView: pmResult.mapView,
	};
	const pmViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		`${vizwizStore.visualizationCustomizationOptions.name} - Point Marker`,
		'pointmarker',
		PointMarkerDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	pmViz.setVisualizationComponents(pmVisualizationComponents);

	// LOB
	const lobResult = CreateLobViewProps(datastreams, {
		name: vizwizStore.visualizationCustomizationOptions.name,
		lineColor: vizwizStore.visualizationCustomizationOptions.lobLineColor,
		lobWeight: vizwizStore.visualizationCustomizationOptions.lobWeight,
		lobOpacity: vizwizStore.visualizationCustomizationOptions.lobOpacity,
		lobDistanceKm: vizwizStore.visualizationCustomizationOptions.lobDistanceKm,
		icon: vizwizStore.visualizationCustomizationOptions.lobIcon,
		iconColor: vizwizStore.visualizationCustomizationOptions.lobIconColor,
		iconName: vizwizStore.visualizationCustomizationOptions.lobIconName,
	});
	const lobVisualizationComponents = {
		dataSource: lobResult.vizDatasources,
		dataLayer: lobResult.lobLayer,
		dataView: lobResult.lobView,
	};
	const lobViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		`${vizwizStore.visualizationCustomizationOptions.name} - LoB`,
		'lob',
		LobDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	lobViz.setVisualizationComponents(lobVisualizationComponents);

	// ELLIPSE
	const ellipseResult = CreateEllipseViewProps(datastreams, {
		name: vizwizStore.visualizationCustomizationOptions.name,
		ellipseColor: vizwizStore.visualizationCustomizationOptions.ellipseColor,
	});
	const ellipseVisualizationComponents: VisualizationComponents = {
		dataSource: ellipseResult.vizDatasources,
		dataLayer: ellipseResult.ellipseLayer,
		dataView: ellipseResult.mapView,
	};
	const ellipseViz: OSHVisualization = new OSHVisualization(
		`${vizwizStore.id}-${randomUUID()}`,
		`${vizwizStore.visualizationCustomizationOptions.name} - Ellipse`,
		'ellipse',
		EllipseDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	ellipseViz.setVisualizationComponents(ellipseVisualizationComponents);

	// FULL BEASTKIT VIZ
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
	visualizationStore.addVisualization(newViz);
	console.log('Created Beastkit Visualization:', newViz);
}
