<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const backgroundColor = ref<string>('#ff0000ff');

watch(backgroundColor, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ backgroundColor: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    backgroundColor: backgroundColor.value,
  });
});

</script>
<template>
  <h3>Background Color</h3>
  <v-color-picker style="margin: auto" v-model="backgroundColor" mode="rgba"> </v-color-picker>
</template>