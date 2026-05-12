<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../composables/useComponentValidation';

const props = defineProps<{
  role?: string;  // Role to use with generateVizName function
  defaultName?: string; // Default value
}>();

const vwStore = useVizWizStore();
const name = ref<string>(props.role ? generateVizName(props.role) : props.defaultName ? props.defaultName : '')

watch(props, (val) => {
  if (val.role) name.value = generateVizName(val.role);
  else if (val.defaultName) name.value = val.defaultName;
})

watch(name, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ name: val });
});

onMounted(() => {
  if (!vwStore.visualizationCustomizationOptions.name) {
    vwStore.updateVisualizationCustomizationOptions({
      name: name.value,
    });
  } else {
    name.value = vwStore.visualizationCustomizationOptions.name;
  }
});

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const valid = computed(() => {
  return !!name.value
})
useComponentValidation(valid, emit)

/**
 * Generates a default visualization name based on selected viz type and a given role's datastream name
 * 
 * @param role
 * @returns 
 */
function generateVizName(role: string) {
  // Find datastream ID of desired role
  const dsId = vwStore.dsConfig[role].dsId

  for (const ds of vwStore.datastreams) {
    if (ds.id === dsId) return `${vwStore.visualizationType}: ${ds.name}`
  }

  return `New ${vwStore.visualizationType}`
}

</script>
<template>
  <h3 class="pb-2">Visualization Name</h3>
  <v-text-field v-model="name" label="Name" :rules="[() => !!name || 'Visualization name is required']">
  </v-text-field>
</template>