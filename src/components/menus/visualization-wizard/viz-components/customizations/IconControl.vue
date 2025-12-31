<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const icon = ref<string>('/icons/map/map-marker.svg');

// Icon Options
// icon value corresponds to mdi icon names AND svg filenames in /icons/map/
const iconOptions = [
  { label: 'Marker', icon: 'map-marker' },
  { label: 'Pin', icon: 'pin' },
  { label: 'Arrow', icon: 'arrow-up-bold' },
  { label: 'Antenna', icon: 'antenna' },
  { label: 'Camera', icon: 'camera-marker' },
  { label: 'Cellphone', icon: 'cellphone-marker' },
  { label: 'Eye', icon: 'eye' },
]

function selectIcon(val: string) {
  icon.value = val;
  vwStore.updateVisualizationCustomizationOptions({ icon: val });
}

onMounted(() => {
  vwStore.updateVisualizationCustomizationOptions({
    icon: icon.value,
  });
});

</script>
<template>
  <v-card class="pa-4" elevation="2">
    <h3>Icon</h3>
    <v-row justify="center" align="center" class="mb-2" v-if="iconOptions">
      <v-col v-for="item in iconOptions" :key="item.icon" cols="12" sm="6" md="3" class="d-flex justify-center">
        <v-card :elevation="icon === `/icons/map/${item.icon}.svg` ? 10 : 2" :color="icon === `/icons/map/${item.icon}.svg` ? 'primary' : ''"
          class="d-flex flex-column align-center justify-center pa-4 type-card"
          @click="selectIcon(`/icons/map/${item.icon}.svg`)"
          style="cursor: pointer; min-height: 120px; max-width: 220px; width: 100%">
          <v-icon size="36" class="mb-2">{{ 'mdi-' + item.icon }}</v-icon>
          <span>{{ item.label }}</span>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>