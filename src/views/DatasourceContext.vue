<script setup>
import { onMounted, watch } from 'vue'

import { ref } from 'vue'
import { useSystemStore } from '@/stores/systemstore.ts'
import { useNodeStore } from '@/stores/nodestore.js'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'
import { useDataStreamStore } from '@/stores/datastreamstore.js'
import { useUIStore } from '@/stores/uistore.ts'
import { useVisualizationStore } from '@/stores/visualizationstore.js'
import { checkDSForProp, CreateVideoViewProps, mineDatasourceObsProps } from '@/lib/DatasourceUtils.js'
import { OSHVisualization } from '@/lib/OSHConnectDataStructs'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import { Geometry } from '@/lib/OSHConnectDefinitions'
import { storeToRefs } from 'pinia'
import { VisualizationComponents } from '@/lib/VisualizationHelpers'
import { Mode } from 'osh-js/source/core/datasource/Mode.js'

  const videoProperty = "http://sensorml.com/ont/swe/property/RasterImage";

  const oshConnect = useOSHConnectStore().getInstance()
  const nodeStore = useNodeStore()
  // const systems = useSystemStore().systems;
  const systemStore = useSystemStore();
  const { systems } = storeToRefs(systemStore)
  const datastreamStore = useDataStreamStore();
  const datastreams = useDataStreamStore().dataStreams;
  const visualizationStore = useVisualizationStore()
  const uiStore = storeToRefs(useUIStore())

  // Define reactive variables for the form fields
  const nodeName = ref('Demo')
  const nodeHost = ref('localhost') // TODO: Change to localhost
  const nodePort = ref('8282') // TODO: Change to 8282
  const nodePath = ref('sensorhub/api')
  const nodeUser = ref('admin')
  const nodePassword = ref('oscar')

  // 1. Create default node for demo
  function createNode() {
    oshConnect.createNode(
      nodeName.value,
      nodeHost.value,
      nodePort.value,
      nodePath.value,
      nodeUser.value,
      nodePassword.value,
      this,
    )
  }

  onMounted(() => {

    console.log('Component is mounted!')

    createNode()
    fetchResources()

  })


  watch(systems.systems, () => {
    addAllSamplingFeaturePMs();
  });

  watch(datastreams, () => {
    createVisualizations();
  });


  function fetchResources() {
    console.log('Fetching resources for demo')
    oshConnect.fetchSlowResources()
  }

  function addAllSamplingFeaturePMs() {
    console.log('Add All Sampling Feature PMs button clicked: ', systems)
    systems.forEach((system) => {
      console.log('SYSTEM: ', system)
      debugger
      system.samplingFeatures.forEach((feature) => {
        console.log('[SystemBrowser] Adding feature marker for:', feature)
        const geom = new Geometry(
          feature.properties.id,
          feature.properties?.geometry.type,
          feature.properties?.geometry.coordinates,
          feature.properties,
          feature.properties?.bbox,
        )
        let newViz = new OSHVisualization(
          'featuremarker-' + randomUUID(),
          `${feature.properties.properties.name}`,
          'pointmarker-feature',
          null,
          undefined,
        )
        newViz.geometry = geom

        visualizationStore.addVisualization(newViz)
      })
    })
  }

  function createVisualizations() {

    if(datastreams.length == 0) return;

    datastreams.forEach((datastream) => {
      console.log(datastream);
      if(!isVideoDataStream(datastream)) return;

      const newViz = new OSHVisualization(`visualization-${randomUUID()}`,
        "video name",
        "video",
        null,
        datastream);

      let videoFormat = "MJPEG"
      const videoResult = CreateVideoViewProps(datastream, videoProperty, videoFormat, {
        startTime: 'now', endTime: '2125-08-01T00:00:00Z', replayMode: Mode.REAL_TIME
      });

      let visualizationComponents = {
        dataSource: videoResult.dataSource,
        dataLayer: videoResult.videoLayer,
        dataView: videoResult.videoView
      }


      if (!newViz || !visualizationComponents) {
        alert('Error creating visualization!');
      } else {
        newViz.setVisualizationComponents(visualizationComponents);
        visualizationStore.addVisualization(newViz);
      }

    });
  }


  function isVideoDataStream(datastream){
    let isVid = datastream.datastream.properties.observedProperties[0].definition == videoProperty;
   return isVid;
  }

</script>

<template>
  <slot></slot>
</template>