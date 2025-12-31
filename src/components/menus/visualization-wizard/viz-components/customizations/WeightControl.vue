<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const weight = ref<number>(10);

watch(weight, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ weight: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    weight: weight.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Weight</h3>
    <v-slider v-model="weight" :min="1" :max="20" step="0.5">
      <template v-slot:append>
        <span>{{ weight }}</span>
      </template>
    </v-slider>
  </v-card>
</template>