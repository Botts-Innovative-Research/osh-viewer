<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const iconColor = ref<string>('#ff0000');

watch(iconColor, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ iconColor: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    iconColor: iconColor.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Icon Color</h3>
    <v-color-picker style="margin: auto" v-model="iconColor" mode="rgba"> </v-color-picker>
  </v-card>
</template>