<script setup>
  import { onMounted } from 'vue';

import { ref } from 'vue'
import { useSystemStore } from '@/stores/systemstore.ts'
import { useNodeStore } from '@/stores/nodestore.js'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'
import { useDataStreamStore } from '@/stores/datastreamstore.js'
import { useVisualizationStore } from '@/stores/visualizationstore.js'


  const oshConnect = useOSHConnectStore().getInstance();
  const nodeStore = useNodeStore()
  const systems = useSystemStore().systems
  const datastreamStore = useDataStreamStore()
  const visualizationStore = useVisualizationStore()

  // Define reactive variables for the form fields
  const nodeName = ref('Demo')
  const nodeHost = ref('192.168.1.127') // TODO: Change to localhost
  const nodePort = ref('8181')          // TODO: Change to 8282
  const nodePath = ref('sensorhub/api')
  const nodeUser = ref('admin')
  const nodePassword = ref('admin')

  // 1. Create default node for demo
  function createNode() {
    oshConnect.createNode(nodeName.value, nodeHost.value, nodePort.value, nodePath.value, nodeUser.value, nodePassword.value, this)
  }

  // 2. Fetch resources for node(s)
  async function fetchResources() {
    console.log("Fetching resources for demo");
    await oshConnect.fetchSlowResources();
    console.log(systems);
  }

  // 3. Create point markers
  function addAllSamplingFeaturePMs() {
  console.log('Add All Sampling Feature PMs button clicked')
  systems.forEach((system) => {
    system.samplingFeatures.forEach((feature) => {
      console.log('[SystemBrowser] Adding feature marker for:', feature);
      const geom = new Geometry(feature.properties.id, feature.properties.geometry.type, feature.properties.geometry.coordinates, feature.properties, feature.properties.bbox)
      let newViz = new OSHVisualization('featuremarker-' + randomUUID(),
        `${feature.properties.properties.name}` ,
        'pointmarker-feature',
        null,
        undefined
      );
      newViz.geometry = geom

      visualizationStore.addVisualization(newViz);
    })
  })
}

  // 4. Create visualizations


  onMounted(async () => {
    console.log('Component is mounted!');
    
    createNode();
    await fetchResources();
    addAllSamplingFeaturePMs();

  });

</script>

<template>
  <slot></slot>
</template>