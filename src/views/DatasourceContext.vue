<script setup>
	import { onMounted, watch } from 'vue';

	import { ref, watchEffect } from 'vue';
	import { useSystemStore } from '@/stores/systemstore.ts';
	import { useNodeStore } from '@/stores/nodestore.js';
	import { useOSHConnectStore } from '@/stores/oshconnectstore.js';
	import { useDataStreamStore } from '@/stores/datastreamstore.js';
	import { useUIStore } from '@/stores/uistore.ts';
	import { useVisualizationStore } from '@/stores/visualizationstore.js';
	import { CreateVideoViewProps } from '@/lib/DatasourceUtils.js';
	import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
	import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
	import { Geometry } from '@/lib/OSHConnectDefinitions';
	import { storeToRefs } from 'pinia';
	import { Mode } from 'osh-js/source/core/datasource/Mode.js';

	const videoProperty = 'http://sensorml.com/ont/swe/property/RasterImage';

	const oshConnect = useOSHConnectStore().getInstance();
	const nodeStore = useNodeStore();
	const systemStore = useSystemStore();
	const { systems } = storeToRefs(useSystemStore());
	const datastreamStore = useDataStreamStore();
	const datastreams = useDataStreamStore().dataStreams;
	const visualizationStore = useVisualizationStore();
	const uiStore = storeToRefs(useUIStore());

	// Define reactive variables for the form fields
	const nodeName = ref('Demo');
	const nodeHost = ref('localhost');
	const nodePort = ref('8282');
	const nodePath = ref('sensorhub/api');
	const nodeUser = ref('admin');
	const nodePassword = ref('admin');

	function createNode() {
		oshConnect.createNode(
			nodeName.value,
			nodeHost.value,
			nodePort.value,
			nodePath.value,
			nodeUser.value,
			nodePassword.value,
			this
		);
	}

	onMounted(() => {
		console.log('[DataSource Context] Component is mounted!');

		fetchResources();

		setTimeout(() => {
			if (systems.value.length > 0) addAllSamplingFeaturePMs();
		}, 2000);
	});

	watch(datastreams, () => {
		console.log('[DataSourceContext] Adding Visualization!');
		createVisualizations();
	});

	function fetchResources() {
		console.log('[DataSourceContext] Fetching resources');
		createNode();
		oshConnect.fetchSlowResources();
	}

	function addAllSamplingFeaturePMs() {
		if (systems.value == null || systems.value.length === 0) {
			console.warn('[DataSourceContext] No systems available');
			return;
		}
		console.log('Add All Sampling Feature PMs');
		systems.value.forEach((system) => {
			system.samplingFeatures.forEach((feature) => {
				console.log('[DataSourceContext] Adding feature marker for:', feature);
				const geom = new Geometry(
					feature.properties.id,
					feature.properties.geometry.type,
					feature.properties.geometry.coordinates,
					feature.properties,
					feature.properties.bbox
				);

				let newViz = new OSHVisualization(
					'featuremarker-' + randomUUID(),
					`${feature.properties.properties.name}`,
					'pointmarker-feature',
					null,
					undefined
				);
				newViz.geometry = geom;

				visualizationStore.addVisualization(newViz);
			});
		});
	}

	function createVisualizations() {
		if (datastreams.length == 0) {
			console.warn('[DataSourceContext] No datastreams found');
			return;
		}

		datastreams.forEach((datastream) => {
			if (!isVideoDataStream(datastream)) return;

			if (hasVizForDatastream(datastream.id)) {
				console.log('Visualization already exists');
				return;
			}

			const newViz = new OSHVisualization(
				`visualization-${randomUUID()}`,
				datastream.name,
				'video',
				null,
				datastream
			);

			let videoFormat = 'MJPEG';
			const videoResult = CreateVideoViewProps(datastream, videoProperty, videoFormat, {
				startTime: 'now',
				endTime: '2125-08-01T00:00:00Z',
				replayMode: Mode.REAL_TIME,
			});

			let visualizationComponents = {
				dataSource: videoResult.dataSource,
				dataLayer: videoResult.videoLayer,
				dataView: videoResult.videoView,
			};

			if (!newViz || !visualizationComponents) {
				alert('Error creating visualization!');
			} else {
				newViz.setVisualizationComponents(visualizationComponents);
				visualizationStore.addVisualization(newViz);
			}
		});
	}

	function isVideoDataStream(datastream) {
		let isVid =
			datastream.datastream.properties.observedProperties[0].definition == videoProperty;
		return isVid;
	}

	function hasVizForDatastream(datastreamId) {
		return visualizationStore.visualizations.some((viz) => {
			return (
				viz.parentDatastream.datastream.properties.id &&
				viz.parentDatastream.datastream.properties.id == datastreamId
			);
		});
	}
</script>

<template>
	<slot />
</template>
