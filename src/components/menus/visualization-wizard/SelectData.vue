<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { useSystemStore } from '@/stores/systemstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { computed, watch } from 'vue';
import {OSHControlStream, OSHDatastream} from '@/lib/OSHConnectDataStructs';
import {useControlStreamStore} from "@/stores/controlstreamstore";

// Stores
const vizwizStore = useVizWizStore();
const datastreamStore = useDataStreamStore();
const controlstreamStore = useControlStreamStore();

// Update values in vizwiz store
const selectedSystems = computed({
	get: () => vizwizStore.systems,
	set: (val: string[]) => vizwizStore.setSystems(val),
});
const selectedDatastreams = computed({
	get: () => vizwizStore.datastreams,
	set: (val: OSHDatastream[]) => vizwizStore.setDatastreams(val),
});

const selectedControlstreams = computed({
  get: () => vizwizStore.controlstreams,
  set: (val: OSHControlStream[]) => vizwizStore.setControlstreams(val),
});

// List of available systems
const listSystems = useSystemStore().systems;
// Filter list of datastreams to include ONLY those from selected systems
const listDatastreams = computed(() => {
	if (!selectedSystems.value.length) return [];
	else return datastreamStore.getDataStreamsBySystemId(selectedSystems.value);
});

const listControlstreams = computed(() => {
  if (!selectedSystems.value.length) return [];
  else return controlstreamStore.getControlStreamsBySystemId(selectedSystems.value);
});

// Clear DATASTREAMS/CONTROLSTREAMS when systems are changed
watch(selectedSystems, () => {
  selectedDatastreams.value = []
  selectedControlstreams.value = []
})

// Clear DS CONFIG/CUSTOMIZE when datastreams are deselected
watch(selectedDatastreams, (newVal, oldVal) => {
  if (newVal.length < oldVal.length) {  // Datastreams were removed
    vizwizStore.resetDsConfig()
    vizwizStore.resetDsCustomization()
  }
})
watch(selectedControlstreams, (newVal, oldVal) => {
  if (newVal.length < oldVal.length) {  // Controlstreams were removed
    vizwizStore.resetCsConfig()
    vizwizStore.resetCsCustomization()
  }
})

</script>
<template>
	<!-- Select for systems -->
	<v-select
		v-model="selectedSystems"
		:items="listSystems"
		hint="Select one or more systems"
		label="Select system(s)"
		multiple
		persistent-hint
		item-title="name"
		item-value="id"
    class="mb-4"
	></v-select>
	<!-- Select for datastreams -->
	<v-select
		v-model="selectedDatastreams"
		:items="listDatastreams"
		hint="Select one or more datastreams"
		label="Select datastream(s)"
		multiple
		persistent-hint
		item-title="name"
		:item-value="(item: OSHDatastream) => item"
    class="mb-4"
	></v-select>
  <!-- Select for controlstreams -->
  <v-select
      v-model="selectedControlstreams"
      :items="listControlstreams"
      hint="Select one or more controlstreams"
      label="Select controlstream(s)"
      multiple
      persistent-hint
      item-title="name"
      :item-value="(item: OSHControlStream) => item"
  ></v-select>
</template>
