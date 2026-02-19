<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
// const emit = defineEmits(['update:webCodec', 'update:stats', 'update:time']);

const useWebCodec = ref<boolean>(false);
const stats = ref<boolean>(false);
const time = ref<boolean>(false);


watch(useWebCodec, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ webCodec: val });
  // emit('update:webCodec', true)
});

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
    webCodec: useWebCodec.value,
    stats: stats.value,
    time: time.value
  });
});
</script>

<template>
  <v-card class="pa-4" elevation="2">
    <v-checkbox
        v-model="useWebCodec"
        label="Use WebCodec"
    />
    <v-checkbox
        v-model="stats"
        label="Show Video Stats"
    />
    <v-checkbox
        v-model="time"
        label="Show Video Time"
    />
  </v-card>
</template>