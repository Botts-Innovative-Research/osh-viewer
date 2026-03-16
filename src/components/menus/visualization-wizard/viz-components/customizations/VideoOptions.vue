<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();

const stats = ref<boolean>(false);
const time = ref<boolean>(false);


watch(stats, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ stats: val });
  // emit('update:stats', true)
});

watch(time, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ time: val });
  // emit('update:time', true)
});


onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    stats: stats.value,
    time: time.value
  });
});
</script>

<template>
  <v-checkbox
      v-model="stats"
      label="Show Video Stats"
  />
  <v-checkbox
      v-model="time"
      label="Show Video Time"
  />
</template>