<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const smoothFactor = ref<number>(1);

watch(smoothFactor, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ smoothFactor: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    smoothFactor: smoothFactor.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Smooth Factor</h3>
    <v-slider v-model="smoothFactor" :min="1" :max="20" step="0.5">
      <template v-slot:append>
        <span>{{ smoothFactor }}</span>
      </template>
    </v-slider>
  </v-card>
</template>