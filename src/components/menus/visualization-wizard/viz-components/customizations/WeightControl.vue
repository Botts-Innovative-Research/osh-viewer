<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const weight = ref<number>(10);

watch(weight, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ weight: val });
});

onMounted(() => {
  if (!vwStore.visualizationCustomizationOptions.weight) {
    vwStore.updateVisualizationCustomizationOptions({
      weight: weight.value,
    });
  } else {
    weight.value = vwStore.visualizationCustomizationOptions.weight
  }
});

</script>
<template>
  <h3>Weight</h3>
  <v-slider v-model="weight" :min="1" :max="20" step="0.5">
    <template v-slot:append>
      <span>{{ weight }}</span>
    </template>
  </v-slider>
</template>