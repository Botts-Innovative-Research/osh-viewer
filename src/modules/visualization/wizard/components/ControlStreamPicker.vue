<script setup lang="ts">
import {
  fetchCsSchema, mineControlObsPropsFromCS,
} from '@/lib/DatasourceUtils';
import { getCommandType } from '@/lib/ControlstreamUtils';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, onMounted, ref, watch } from 'vue'
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../../../components/menus/visualization-wizard/shared/helpers';

const props = withDefaults(defineProps<{
  role: string, // Property role to be used as key in vizwiz store
  showPropertySelector?: boolean,
}>(), {
  showPropertySelector: true,
})

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

// If already selected datastream on mount (edit viz), fetch props
onMounted(async () => {
  if (selectedControlstream.value) {
    await fetchProps();
  }
})

// Validation: must have a controlstream selected, and if property selector is shown, must have property(ies) selected
const emit = defineEmits<VisualizationComponentEmits>()
const valid = computed(() => {
  // Check that a controlstream is selected
  if (!selectedControlstream.value) return false
  // If property selector is shown, check that a property is selected
  if (props.showPropertySelector) {
    return !!selectedProperty.value
  }
  return true
})
useComponentValidation(valid, emit)

</script>

<template>
  <!-- Select for controlstreams -->
  <v-autocomplete v-model="selectedControlstream" :items="listControlstreams" label="Select controlstream" persistent-hint
    item-title="name" item-value="id"></v-autocomplete>

  <!-- Select for property -->
  <v-autocomplete
      v-if="showPropertySelector && csSchema && csSchema.parametersSchema"
      v-model="selectedProperty"
      :items="csSchema.parametersSchema.items"
      label="Select property"
      item-title="name"
      persistent-hint item-value="name"
      multiple
      chips
      ></v-autocomplete>
</template>

<style scoped></style>
