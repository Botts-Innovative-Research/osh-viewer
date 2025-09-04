<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSystemStore } from '@/stores/systemstore.ts'
import { useNodeStore } from '@/stores/nodestore.js'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'
import { useDataStreamStore } from '@/stores/datastreamstore.js'
import { useUIStore } from '@/stores/uistore.ts'
import { useVisualizationStore } from '@/stores/visualizationstore.js'
import { checkDSForProp, mineDatasourceObsProps } from '@/lib/DatasourceUtils.js'
import { OSHSystem, OSHVisualization } from '@/lib/OSHConnectDataStructs.js'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import VisualizationWizard from '@/components/menus/VisualizationWizard.vue'
import NodeConfigForm from '@/components/menus/NodeConfigForm.vue'
import { storeToRefs } from 'pinia'
import { Geometry } from '@/lib/OSHConnectDefinitions'

const oshConnect = useOSHConnectStore().getInstance();
const nodeStore = useNodeStore()
const systems = useSystemStore().systems
const datastreamStore = useDataStreamStore()
const visualizationStore = useVisualizationStore()
const uiStore = storeToRefs(useUIStore())
const setSelectedDatastream = useUIStore().setSelectedDatastream
const activeTab = ref('systems') // Default active tab
const tabLabels = ref(['Systems', 'DataStreams', 'Nodes'])
const visualizationWizardOpen = uiStore.visualizationWizardOpen
const openVisualizationWizard = useUIStore().openVisualizationWizard
const nodeConfigFormOpen = uiStore.nodeConfigFormOpen
const openNodeConfigForm = useUIStore().openNodeConfigForm

/*
const getSystems = () => {
  // This function will be called when the button is clicked
  console.log('Get Systems button clicked')

  nodeStore.nodes.forEach((node) => {
    console.log('Node:', node)
    node.getAllSystems()
  })
  // node.getAllSystems()
}

const getAllDatastreams = () => {
  console.log('Get Data Streams button clicked')
  nodeStore.nodes.forEach((node) => {
    console.log('Node:', node)
    node.getAllDataStreams()
  })
}
*/

const fetchResources = () => {
  console.log('Fetch Resources button clicked', oshConnect)
  oshConnect.fetchSlowResources();
}

const addVisualization = (item) => {
  console.log('Item properties:', Object.keys(item));
  console.log('Add Visualization button clicked for item:', item);
  setSelectedDatastream(item)
  openVisualizationWizard()
}

const openNodeConfig = () => {
  console.log('Opened node config form')
  openNodeConfigForm()
}

const addFeatureMarker = (item) => {
  console.log('Add Feature Marker button clicked for item:', item)
  const oshSystem: OSHSystem = item as OSHSystem

  for (let foi of oshSystem.samplingFeatures) {
    console.log('Feature of Interest:', foi)

    const geom = new Geometry(foi.properties.id, foi.properties.geometry.type, foi.properties.geometry.coordinates, foi.properties, foi.properties.bbox)
    console.log('SamplingFeature Geometry:', geom)

    let newViz = new OSHVisualization('featuremarker-' + randomUUID(),
      foi.properties.properties.name,
      'pointmarker-feature',
      null,
      undefined
    );
    newViz.geometry = geom

    visualizationStore.addVisualization(newViz);

  }
}

const addAllSamplingFeaturePMs = () => {
  console.log('Add All Sampling Feature PMs button clicked')
  systems.forEach((system) => {
    system.samplingFeatures.forEach((feature) => {
      console.log('[SystemBrowser] Adding feature marker for:', feature);
      const geom = new Geometry(feature.properties.id, feature.properties.geometry.type, feature.properties.geometry.coordinates, feature.properties, feature.properties.bbox)
      let newViz = new OSHVisualization('featuremarker-' + randomUUID(),
        `${feature.properties.properties.name}`,
        'pointmarker-feature',
        null,
        undefined
      );
      newViz.geometry = geom

      visualizationStore.addVisualization(newViz);
    })
  })
}

const getItemChildren = computed(() => {
  return (item) => {
    return item?.getDSChildren ? item.getDSChildren() : []
  }
})

</script>
<template>
  <v-tabs v-model="activeTab">
    <v-tab v-for="(label, index) in tabLabels" :key="index" :value="label.toLowerCase()">
      {{ label }}

    </v-tab>
  </v-tabs>
  <v-btn @click="fetchResources">Fetch Resources</v-btn>
  <v-btn @click="addAllSamplingFeaturePMs">All PMS</v-btn>

  <v-tabs-window v-model="activeTab">
    <v-tabs-window-item value="systems" class="tab">
      <v-treeview width="100%" :items="systems" item-value="uuid" item-title="name" :item-children="getItemChildren"
        color="primary" activatable>
        <template v-slot:prepend>
          <v-icon icon="mdi-cogs"></v-icon>
        </template>
        <template v-slot:append="{ item }">
          <v-btn icon="mdi-map-marker-plus" @click="() => addFeatureMarker(item)"></v-btn>
        </template>
      </v-treeview>
    </v-tabs-window-item>

    <v-tabs-window-item value="datastreams" class="tab">
      <v-treeview width="100%" :items="datastreamStore.dataStreams" item-value="uuid" item-title="name" color="primary"
        activatable>

        <template v-slot:prepend>
          <v-icon icon="mdi-cable-data"></v-icon>
        </template>

        <template v-slot:append="{ item }">
          <v-tooltip text="Add Visualization" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-eye-plus" size="small" @click="() => addVisualization(item)"></v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Properties" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-list-box-outline" size="small"></v-btn>
            </template>
          </v-tooltip>
        </template>

      </v-treeview>
    </v-tabs-window-item>

    <v-tabs-window-item value="nodes" class="tab">
      <v-btn block prepend-icon="mdi-plus-circle" variant="flat" color="success" @click="() => openNodeConfig()">
        Add Node
      </v-btn>
      <v-treeview width="100%" :items="nodeStore.nodes" item-value="uuid" item-title="name" color="primary" activatable>
        <template v-slot:prepend>
          <v-icon icon="mdi-server"></v-icon>
        </template>
      </v-treeview>
    </v-tabs-window-item>
  </v-tabs-window>

  <v-dialog v-model="visualizationWizardOpen" max-width="540">
    <VisualizationWizard />
  </v-dialog>
  <v-dialog v-model="nodeConfigFormOpen" max-width="540">
    <NodeConfigForm />
  </v-dialog>
</template>

<style scoped>
.tab {
  margin: 2%;
}
</style>
