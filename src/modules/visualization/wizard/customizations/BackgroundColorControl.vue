<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = defineProps<{
  lineId?: string;  // Used to identify which line's background color is being customized, if multiple lines are present
}>();

const vwStore = useVizWizStore();
const backgroundColor = ref<string>('#00000000');
const lineId = computed(() => props.lineId ?? undefined); // Default to 'backgroundColor' if no lineId is provided

watch(backgroundColor, (val) => {
  if (!lineId.value)
    vwStore.updateVisualizationCustomizationOptions({ backgroundColor: val });
  else {
    const existing = vwStore.visualizationCustomizationOptions.backgroundColor;

    vwStore.updateVisualizationCustomizationOptions({
      backgroundColor: {
        ...(typeof existing === 'object' && existing !== null ? existing : {}),
        [lineId.value]: val
      }
    });
  }
});

onMounted(() => {
  // Initialize background color in store if not already set
  if (!vwStore.visualizationCustomizationOptions.backgroundColor) {
    // For lines without line ID (e.g. lob)
    if (!lineId.value) {
      vwStore.updateVisualizationCustomizationOptions({
        backgroundColor: backgroundColor.value,
      });
    } else {
      vwStore.updateVisualizationCustomizationOptions({
        backgroundColor: {
          [lineId.value]: backgroundColor.value
        },
      });
    }
  }
  // Set local backgroundColor based on store value
  else {
    if (!lineId.value) {
      backgroundColor.value = vwStore.visualizationCustomizationOptions.backgroundColor
    } else if (vwStore.visualizationCustomizationOptions.backgroundColor[lineId.value]) {
      backgroundColor.value = vwStore.visualizationCustomizationOptions.backgroundColor[lineId.value]
    }
  }
});

</script>
<template>
  <h3 class="pb-2">Background Color</h3>
  <v-color-picker style="margin: auto" v-model="backgroundColor" mode="rgba"> </v-color-picker>
</template>