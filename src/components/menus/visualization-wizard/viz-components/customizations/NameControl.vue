<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { generateVizName, useComponentValidation } from '../../shared/helpers';
import { VisualizationComponentEmits } from '../../VisualizationRegistry';

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

</script>
<template>
  <h3>Visualization Name</h3>
  <v-text-field v-model="name" label="Name" :rules="[() => !!name || 'Visualization name is required']">
  </v-text-field>
</template>