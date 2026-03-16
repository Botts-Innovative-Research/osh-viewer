<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const maxPoints = ref<number>(10);

watch(maxPoints, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ maxPoints: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    maxPoints: maxPoints.value,
  });
});

</script>
<template>
  <h3>Max Points</h3>
  <v-slider v-model="maxPoints" :min="1" :max="100" step="0.5">
    <template v-slot:append>
      <span>{{ maxPoints }}</span>
    </template>
  </v-slider>
</template>