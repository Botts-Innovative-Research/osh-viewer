// TODO: Implement clear of datastreams when systems changes


<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { useSystemStore } from '@/stores/systemstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { computed, watch } from 'vue';

// Stores
const vizwizStore = useVizWizStore()
const datastreamStore = useDataStreamStore()

// Update selected systems and datastreams in vizwiz store
const selectedSystems = computed({
  get: () => vizwizStore.systems,
  set: (val: string[]) => vizwizStore.setSystems(val)
})
const selectedDatastreams = computed({
  get: () => vizwizStore.datastreams,
  set: (val: string[]) => { vizwizStore.setDatastreams(val); console.log("Changed"); console.log(val) }
})

// List of available systems
const listSystems = useSystemStore().systems
// Filter list of datastreams to include ONLY those from selected systems
const listDatastreams = computed(() => {
  if (!selectedSystems.value.length) return []
  else return datastreamStore.getDataStreamsBySystemId(selectedSystems.value)
})

// CLEAR DATASTREAMS when systems are changed
watch(selectedSystems, () => {
  selectedDatastreams.value = []
})

</script>
<template>
  <!-- Select for systems -->
  <v-select v-model="selectedSystems" :items="listSystems" hint="Select one or more systems" label="Select system(s)"
    multiple persistent-hint item-title="name" item-value="id"></v-select>
  <!-- Select for datastreams -->
  <v-select v-model="selectedDatastreams" :items="listDatastreams" hint="Select one or more datastreams" label="Select datastream(s)"
    multiple persistent-hint item-title="name" item-value="id"></v-select>
</template>