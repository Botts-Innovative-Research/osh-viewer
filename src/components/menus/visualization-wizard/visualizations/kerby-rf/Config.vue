<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, onMounted, watch } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';

const vizwizStore = useVizWizStore()

const checkedRoles = {
  stream: computed({
    get: () => vizwizStore.dsConfig.stream?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("stream", { selected: val })
  }),
}

onMounted(() => {
  if (!vizwizStore.dsConfig.stream) {
    vizwizStore.updateDsConfig("stream", { selected: true })
  }
})

watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.stream) {
    vizwizStore.updateDsConfig("stream", { selected: true })
  }
}, { deep: true })
</script>

<template>
  <v-container>
    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      Select any Kerby datastream (e.g. a tuner). All related datastreams and
      control streams from the same system will be auto-discovered.
    </v-alert>
    <v-checkbox label="Primary Datastream" v-model="checkedRoles.stream" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.stream" role="stream" :showPropertySelector="false" />
  </v-container>
</template>
