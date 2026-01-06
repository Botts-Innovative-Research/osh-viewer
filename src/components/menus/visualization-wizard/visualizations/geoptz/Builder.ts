import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { VisualizationComponents } from '@/lib/VisualizationHelpers';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateControlstreams } from '../../shared/helpers';

export function build() {
	console.log('Building GeoPTZ Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const controlstreams = AggregateControlstreams();

	const visualizationComponents: VisualizationComponents = {
		dataSource: [],
		dataLayer: null,
		dataView: null
	};

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		`GeoPTZ`,
		'geoPtz',
		null,
		null,
		controlstreams
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created GeoPTZ Visualization:', newViz);
}
