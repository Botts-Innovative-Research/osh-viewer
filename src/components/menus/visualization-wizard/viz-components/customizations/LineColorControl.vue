<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = defineProps<{
  lineId?: string;  // Used to identify which line's color is being customized, if multiple lines are present
}>();

const vwStore = useVizWizStore();
const lineColor = ref<string>('#ff0000ff');
const lineId = computed(() => props.lineId ?? undefined); // Default to 'lineColor' if no lineId is provided

watch(lineColor, (val) => {
  if (!lineId.value)
    vwStore.updateVisualizationCustomizationOptions({ lineColor: val });
  else {
    const existing = vwStore.visualizationCustomizationOptions.lineColor;

    vwStore.updateVisualizationCustomizationOptions({
      lineColor: {
        ...(typeof existing === 'object' && existing !== null ? existing : {}),
        [lineId.value]: val
      }
    });
  }
})

onMounted(() => {
  // Initialize line color in store if not already set
  if (!vwStore.visualizationCustomizationOptions.lineColor) {
    // For lines without line ID (e.g. lob)
    if (!lineId.value) {
      vwStore.updateVisualizationCustomizationOptions({
        lineColor: lineColor.value,
      });
    } else {
      vwStore.updateVisualizationCustomizationOptions({
        lineColor: {
          [lineId.value]: lineColor.value
        },
      });
    }
  }
  // Set local lineColor based on store value
  else {
    if (!lineId.value) {
      lineColor.value = vwStore.visualizationCustomizationOptions.lineColor
    } else if (vwStore.visualizationCustomizationOptions.lineColor[lineId.value]) {
      lineColor.value = vwStore.visualizationCustomizationOptions.lineColor[lineId.value]
    }
  }
});

</script>
<template>
  <h3 class="pb-2">Line Color</h3>
  <v-color-picker style="margin: auto" v-model="lineColor" mode="rgba"> </v-color-picker>
</template>