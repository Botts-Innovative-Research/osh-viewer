//@ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { onBeforeUnmount, Ref } from "vue";
import { disconnectDatasources } from '../../services/datasource.service';

/**
 * Disconnects datasources on component UNMOUNT
 * 
 * @param dsInstances 
 */
export function useVisualizationCleanup(dsInstances: Ref<SweApi[]>) {
  onBeforeUnmount(() => {
    disconnectDatasources(dsInstances)
  })
}