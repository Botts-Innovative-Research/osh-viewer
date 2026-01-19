<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const clampToGround = ref<boolean>(true);

watch(clampToGround, (val) => {
  vwStore.updateVisualizationCustomizationOptions({ clampToGround: val });
});

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    clampToGround: clampToGround.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Clamp To Ground</h3>
    <v-checkbox v-model="clampToGround">
    </v-checkbox>
  </v-card>
</template>