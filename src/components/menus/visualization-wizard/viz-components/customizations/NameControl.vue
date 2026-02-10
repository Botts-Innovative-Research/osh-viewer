<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { generateVizName } from '../../shared/helpers';

const props = defineProps<{
  role?: string;  // Role to use with generateVizName function
  defaultName?: string; // Default value
}>();

const vwStore = useVizWizStore();
const name = ref<string>(
  props.role ? generateVizName(props.role) : props.defaultName ? props.defaultName : ''
)

watch(props, (val) => {
  if (val.role) name.value = generateVizName(val.role);
  else if (val.defaultName) name.value = val.defaultName;
})

watch(name, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ name: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    name: name.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Visualization Name</h3>
    <v-text-field v-model="name" label="Name">
    </v-text-field>
  </v-card>
</template>