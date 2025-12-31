<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const distanceKm = ref<number>(1);

watch(distanceKm, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ distanceKm: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    distanceKm: distanceKm.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Distance (Km)</h3>
    <v-slider v-model="distanceKm" :min="0" :max="100" step="0.1">
      <template v-slot:append>
        <span>{{ distanceKm }} km</span>
      </template>
    </v-slider>
  </v-card>
</template>