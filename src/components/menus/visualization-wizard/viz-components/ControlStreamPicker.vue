<script setup lang="ts">
import {
  fetchCsSchema, mineControlObsPropsFromCS,
} from '@/lib/DatasourceUtils';
import { getCommandType } from '@/lib/ControlstreamUtils';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  role: string, // Property role to be used as key in vizwiz store
}>()

// Get controlstreams from vizwiz store
const vizwizStore = useVizWizStore()
const listControlstreams = computed(() => {
  return vizwizStore.controlstreams
})

// Update selected controlstream for this role in vizwiz store
const selectedControlstream = computed({
  get: () => vizwizStore.csConfig[props.role]?.csId,
  set: (val: string) => vizwizStore.updateCsConfig(props.role, { csId: val, property: null})
})

const selectedProperty = computed({
  get: () => vizwizStore.csConfig[props.role]?.property,
  set: (val: string) => vizwizStore.updateCsConfig(props.role, { property: val })
})

// Properties schema for selected datastream
const csSchema = ref<any>(null)

// Fetch datasource observed properties
async function fetchProps() {
  const { cs, controlledProperties } = mineControlObsPropsFromCS(selectedControlstream.value)
  csSchema.value = await fetchCsSchema(cs.controlstream)

  // Add schema to control stream store for PTZControl to access
  if (csSchema.value?.parametersSchema) {
    const schemaItems = csSchema.value.parametersSchema.items
      ? csSchema.value.parametersSchema.items
      : csSchema.value.parametersSchema;
    getCommandType(schemaItems, selectedControlstream.value);

    if (Array.isArray(schemaItems)) {
      const allPropNames = schemaItems.map((item: any) => item.name);
      vizwizStore.updateCsConfig(props.role, { property: allPropNames });
    }
  }
}

// Watch for changes in selected datastream to update properties
watch(selectedControlstream, async (newVal) => {
  if (!newVal) return
  await fetchProps()
})



</script>

<template>
  <!-- Select for controlstreams -->
  <v-select v-model="selectedControlstream" :items="listControlstreams" label="Select controlstream" persistent-hint
    item-title="name" item-value="id"></v-select>

  <!-- Select for property -->
  <v-select
      v-if="csSchema && csSchema.parametersSchema"
      v-model="selectedProperty"
      :items="csSchema.parametersSchema.items"
      label="Select property"
      item-title="name"
      persistent-hint item-value="name"
      multiple></v-select>
</template>

<style scoped></style>
