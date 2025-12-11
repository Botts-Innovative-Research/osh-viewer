<script setup lang="ts">
import {
	fetchSchema,
	mineDatasourceObsPropsFromDS,
	SchemaFieldProperty,
} from '@/lib/DatasourceUtils';
import { OSHDatastream } from '@/lib/OSHConnectDataStructs';
import { onMounted, ref, watch } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const emit = defineEmits(['update:selectedProperty']);
const selectedDatasources = useVizWizStore().datastreams;
const dsSchema = ref<any>(null);
const obsProps = ref<{ definition: string; label: string }[]>([]);
const selectedProperties = ref<SchemaFieldProperty[]>([]);

// Fetch datasource observed properties
async function fetchProps(datasource: OSHDatastream) {
	const { ds, observedProps } = mineDatasourceObsPropsFromDS(datasource);

	obsProps.value = observedProps;
	dsSchema.value = await fetchSchema(ds.datastream);
}

onMounted(() => {
	for (const ds of selectedDatasources) {
		fetchProps(ds);
	}
});

watch(
	selectedProperties,
	(val) => {
		emit('update:selectedProperty', val);
	},
	{ deep: true }
);
</script>

<template>
	<v-card class="pa-4" elevation="2">
		<h3 class="mb-4">Select Property</h3>
		<div v-if="dsSchema">
			<v-checkbox
				v-for="property in dsSchema.recordSchema.fields"
				:key="property.definition"
				:value="property"
				v-model="selectedProperties"
			>
				<template v-slot:label>
					<div class="property-row no-wrap">
						<span class="pa-2 property-label font-weight-bold" :key="property.label">{{
							property.label
						}}</span>
						<span class="pa-2 property-name text-grey-darken-1" :key="property.name">{{
							property.name
						}}</span>
						<span
							class="pa-2 property-definition text-caption text-grey"
							:key="property.definition"
							>{{ property.definition }}</span
						>
					</div>
				</template>
			</v-checkbox>
		</div>
	</v-card>
</template>

<style scoped></style>
