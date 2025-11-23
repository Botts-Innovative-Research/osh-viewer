<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { VisualizationType } from '@/types/types';
import { ref, defineProps, computed, reactive } from 'vue';
import PlaybackMode from '../../viz-components/PlaybackMode.vue';

const props = defineProps<({
})>()

// Retrieve datastreams
const vizwizStore = useVizWizStore()
const listDatastreams = computed(() => {
  return vizwizStore.datastreams
})

const config = reactive({
  playbackMode: { "label": "REAL TIME", "value": "realTime" } // Set default to real time
})

</script>
<template>
  <!-- SELECT PROPERTIES -->
   <div v-for="datastream in listDatastreams">

   </div>
  <!-- PLAYBACK MODE -->
  <PlaybackMode v-model="config.playbackMode" />
</template>