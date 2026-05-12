<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import BackgroundColorControl from '@/modules/visualization/wizard/customizations/BackgroundColorControl.vue';
import LineColorControl from '@/modules/visualization/wizard/customizations/LineColorControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import { computed, ref, watch } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

const vizwizStore = useVizWizStore()
const defaultName = ref<string>('')
// Get properties organized per line
const lines = computed(() => {
  const yConfig = vizwizStore.dsConfig.y
  if (!yConfig) return []
  else return getYLines(yConfig);
})
const selectedTab = ref<any>()

watch(lines, (val) => {
  if (val.length > 0) {
    selectedTab.value = val[0]
  }
})

watch(() => vizwizStore.dsConfig.y, (val) => {
  if (val && val.label) {
    defaultName.value = val.label + (val.uom ? ` (${val.uom})` : '')
  }
}, { immediate: true, deep: true })

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const nameValid = ref<boolean>(false)
const valid = computed(() => {
  return nameValid.value
})
useComponentValidation(valid, emit)

/**
 * Turn dsConfig.y properties into an array of line configurations for the chart visualization
 * @param yConfig 
 */
function getYLines(yConfig: any) {
  if (!yConfig) return []

  const yProperties = Array.isArray(yConfig.property) ? yConfig.property : [yConfig.property]
  const yLabels = Array.isArray(yConfig.label) ? yConfig.label : [yConfig.label]
  const yUoms = Array.isArray(yConfig.uom) ? yConfig.uom : [yConfig.uom]

  return yProperties.map((prop: string, index: number) => ({
    property: prop,
    label: yLabels[index] || `Y-Axis Data ${index + 1}`,
    uom: yUoms[index] || '',
  }))
}

</script>

<template>
  <name-control :default-name="defaultName" v-model:valid="nameValid"></name-control>
  <v-sheet v-if="lines">
    <h2>Customize Line{{ lines.length > 1 ? `s` : '' }}</h2>
    <v-tabs v-model="selectedTab">
      <v-tab v-for="line in lines" :key="line.property" :value="line">
        {{ line.label }}
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="selectedTab">
      <v-tabs-window-item v-for="line in lines" :key="line.property" :value="line">
        <v-row class="justify-space-between pa-4">
          <v-col cols="auto">
            <LineColorControl :line-id="line.property" :key="line.property"></LineColorControl>
          </v-col>
          <v-col cols="auto">
            <BackgroundColorControl :line-id="line.property" :key="`bg-${line.property}`"></BackgroundColorControl>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-sheet>
</template>