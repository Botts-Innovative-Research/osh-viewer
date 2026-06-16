//@ts-ignore
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import { onBeforeUnmount, Ref } from 'vue';
import { disconnectDatasources } from '../../services/datasource.service';

/**
 * Disconnects datasources on component UNMOUNT
 *
 * @param dsInstances
 */
export function useVisualizationCleanup(dsInstances: Ref<(typeof ConSysApi)[]>) {
	onBeforeUnmount(() => {
		disconnectDatasources(dsInstances);
	});
}
