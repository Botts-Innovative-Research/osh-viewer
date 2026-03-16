<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const lineColor = ref<string>('#ff0000ff');

watch(lineColor, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ lineColor: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    lineColor: lineColor.value,
  });
});

</script>
<template>
  <h3>Line Color</h3>
  <v-color-picker style="margin: auto" v-model="lineColor" mode="rgba"> </v-color-picker>
</template>