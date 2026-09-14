<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { OSHControlStream, OSHDatastream } from '@/lib/OSHConnectDataStructs';
import {
	fetchDsSchema,
	mineDatasourceObsPropsFromDS,
} from '@/modules/visualization/services/datasource.service';
import {
	fetchCsSchema,
	mineControlObsPropsFromCS,
} from '@/modules/visualization/services/controlstream.service';

const props = defineProps<{
	item: OSHDatastream | OSHControlStream;
}>();

const parentSystem = ref<string | null>(null);
const details = ref<any | null>(null);
const schema = ref<any | null>(null);
const itemType = computed(() => {
	if (props.item instanceof OSHDatastream) return 'ds';
	else if (props.item instanceof OSHControlStream) return 'cs';
});

watch(
	() => props.item,
	async (item) => {
		schema.value = null;

		if (itemType.value === 'ds') {
			const { ds } = mineDatasourceObsPropsFromDS(item.id);
			details.value = ds.datastream.properties;
			const rawSchema = (await fetchDsSchema(ds.datastream)).recordSchema;
			schema.value = rawSchema.fields ?? rawSchema.items;
			parentSystem.value = details.value['system@link'].uid;
		} else if (itemType.value === 'cs') {
			const { cs } = mineControlObsPropsFromCS(item.id);
			details.value = cs.controlstream.properties;
			const rawSchema = (await fetchCsSchema(cs.controlstream)).parametersSchema;
			schema.value = rawSchema.fields ?? rawSchema.items;
			parentSystem.value = details.value['system@link'].uid;
		}
	},
	{ immediate: true }
);
</script>

<template>
	<v-card>
		<v-card-title>Properties</v-card-title>
		<v-card-text>
			<v-table class="overflow-wrap">
				<tbody>
					<tr>
						<td>Name</td>
						<td>{{ details.name }}</td>
					</tr>
					<tr>
						<td>Type</td>
						<td>{{ itemType === 'ds' ? 'Datastream' : 'Controlstream' }}</td>
					</tr>
					<tr>
						<td>ID</td>
						<td>{{ details.id }}</td>
					</tr>
					<!-- Parent Data -->
					<tr>
						<td>{{ itemType === 'ds' ? 'Source System' : 'Receiving System' }}</td>
						<td>{{ parentSystem }}</td>
					</tr>
					<!-- Time Data -->
					<tr v-if="details.validTime">
						<td>Valid Time</td>
						<td>{{ details.validTime[0] + ' - ' + details.validTime[1] }}</td>
					</tr>
					<tr v-if="details.phenomenonTime">
						<td>Phenomenon Time</td>
						<td>{{ details.phenomenonTime[0] + ' - ' + details.phenomenonTime[1] }}</td>
					</tr>
					<tr v-if="details.resultTime">
						<td>Result Time</td>
						<td>{{ details.resultTime[0] + ' - ' + details.resultTime[1] }}</td>
					</tr>
					<!-- Properties -->
					<tr>
						<td>Properties</td>
						<td>
							<v-table
								density="compact"
								class="mt-1 mb-1"
								height=""
							>
								<thead>
									<tr>
										<th>Name</th>
										<th>Units</th>
									</tr>
								</thead>
								<tr v-for="property in schema">
									<td>{{ property.label ?? property.name }}</td>
									<td v-if="property.uom && property.uom.code">
										{{ property.uom.code }}
									</td>
									<td v-else>-</td>
								</tr>
							</v-table>
						</td>
					</tr>
				</tbody>
			</v-table>
		</v-card-text>
	</v-card>
</template>

<style scoped>
:deep(td) {
	white-space: normal;
	word-break: break-word;
	overflow-wrap: anywhere;
}
:deep(.v-table) {
	display: block;
	max-height: 60vh;
	overflow-y: auto;
}
:deep(th) {
	padding: 0;
}
</style>
