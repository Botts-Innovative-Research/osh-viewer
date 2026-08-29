<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { onMounted, ref } from 'vue';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { IConSysApiDataSourceProperties } from '../../types/datasource';

const tableDatasources = ref<any[]>([]);
const rows = ref<Record<string, any>[]>([]);
const headers = ref<{ title: string; key: string }[]>([]);
const itemsPerPage = ref(10);

const props = defineProps<{
	visualization: OSHVisualization;
	datasources: IConSysApiDataSourceProperties[];
}>();

function getSelectedProperties(datasource: IConSysApiDataSourceProperties): string[] {
	const allProps: string[] = [];
	const roles = datasource.properties;
	for (const [role, entry] of Object.entries(roles)) {
		const prop = entry?.property;
		if (!prop) continue;
		if (Array.isArray(prop)) {
			allProps.push(...prop);
		} else if (typeof prop === 'string') {
			allProps.push(prop);
		}
	}
	return allProps;
}

onMounted(async () => {
	const allSelectedProps = new Set<string>();

	for (const datasource of props.datasources) {
		const dsInstance = createDatasource(datasource);
		tableDatasources.value.push(dsInstance);

		dsInstance.connect();

		const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);
		const selectedProps = getSelectedProperties(datasource);
		selectedProps.forEach((p) => allSelectedProps.add(p));

		dataBroadcastChannel.onmessage = (message) => {
			if (message.data.type !== 'data') return;

			const data = message.data.values[0].data;
			const row: Record<string, any> = {};

			for (const prop of selectedProps) {
				if (prop && prop in data) {
					row[prop] = data[prop];
				}
			}

			rows.value.push(row);
		};
	}

	headers.value = Array.from(allSelectedProps).map((prop) => ({
		title: prop,
		key: prop,
	}));
});

useVisualizationCleanup(tableDatasources);
</script>

<template>
	<v-sheet>
		<v-data-table
			:headers="headers"
			:items="rows"
			:items-per-page="itemsPerPage"
		>
		</v-data-table>
	</v-sheet>
</template>
