<script setup lang="ts">
import DataSynchronizer from 'osh-js/source/core/timesync/DataSynchronizer.js';
import DataSynchronizerWorker from './DataSynchronizer.replay.worker.js?worker';
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { onMounted, onUnmounted, ref } from 'vue';

const dataSynchronizer = ref<DataSynchronizer | null>(null);
const datasourceId = ref('');

onMounted(() => {
  // Initialize the DataSynchronizer when the component is mounted
  dataSynchronizer.value = new DataSynchronizer({
    startTime: 0, // Set appropriate start time
    endTime: 10000, // Set appropriate end time
    replaySpeed: 1,
    intervalRate: 5,
    dataSources: [], // Populate with actual data sources
    mode: Mode.REPLAY,
  });
});

function addDatasource() {
  if (!dataSynchronizer.value || !datasourceId.value) return;

  dataSynchronizer.value.addDataSource(datasourceId.value);

  // optional: reconnect to apply immediately
  dataSynchronizer.value.disconnect();
  dataSynchronizer.value.connect();
}

function startReplay() {
  dataSynchronizer.value?.connect();
}

function pauseReplay() {
  dataSynchronizer.value?.disconnect();
}

onUnmounted(() => {
  // Clean up the DataSynchronizer when the component is unmounted
  dataSynchronizer.value?.disconnect();
});

</script>

<template>
  <v-card class="pa-2 elevation-10">
    <v-card-title>Replay Synchronizer</v-card-title>
    <v-card-text>
      <v-text-field label="Add Datasource ID" v-model="datasourceId" type="string" />
      <v-btn @click="addDatasource">Add Datasource</v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped></style>