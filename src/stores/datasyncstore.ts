import {defineStore} from 'pinia';
import {ref, Ref} from 'vue';
import DataSynchronizer from 'osh-js/source/core/timesync/DataSynchronizer.js';
import { Mode } from 'osh-js/source/core/datasource/Mode';

export const useDataSyncStore = defineStore('dataSynchronizer', () => {
  const dataSynchronizer: Ref<DataSynchronizer> = ref(null);
  const datasourceIds: Ref<string[]> = ref([]); // Store datasource IDs to be used for synchronization


  return {
    dataSynchronizer,
    datasourceIds
  }
})