<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mode } from 'osh-js/source/core/datasource/Mode.js'
import { useVizWizStore } from '@/stores/vizwizstore';
import TimePicker from '@/components/menus/TimePicker.vue'
import { usePlaybackModeSync, useStartEndTimeSync } from '@/composables/DataSourceOptions';

// Visualization Wizard Stores
const vizwizStore = useVizWizStore()
const playbackMode = computed({
  get: () => vizwizStore.globalConfig.playback,
  set: (value: string) => vizwizStore.updateGlobalConfig({ playback: value })
})

// Playback modes
const listModes = Object.entries(Mode).map(([key, value]) => ({
  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  value
}))

// TODO: Time variables

</script>

<template>
  <!-- TODO: TIME PICKERS -->
  <v-combobox
    v-model="playbackMode"
    :items="listModes"
    item-title="label"
    item-value="value"
    label="Playback Mode"
    variant="solo"
    density="compact"
  />
</template>

<style scoped>

</style>