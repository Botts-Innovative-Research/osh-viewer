<script setup lang="ts">
import { fetchSchema, SchemaFieldProperty } from '@/lib/DatasourceUtils';
import {OSHControlStream, OSHDatastream} from '@/lib/OSHConnectDataStructs';
import { computed, onMounted, ref, watch } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const emit = defineEmits(['update:selectedProperty']);
const selectedControlstreams = useVizWizStore().controlstreams;
const csSchema = ref<any>(null);

const selectedProperties = ref<SchemaFieldProperty[]>([]);
const schemas = ref<SchemaFieldProperty[]>([]);

const allFields = computed(() => {
	let fields: SchemaFieldProperty[] = [];
	for (const schema of schemas.value) {
		if (schema.fields && Array.isArray(schema.fields)) {
			fields.push(...schema.fields);
		}
	}
	return fields;
});

const fieldToCSId = computed(() => {
	let mapping: { csID: string; fieldIdx: number }[] = [];
	for (const schema of schemas.value) {
		if (schema.fields && Array.isArray(schema.fields)) {
			for (const field of schema.fields) {
				if (schema.controlstream_id) {
					mapping.push({
						csID: schema.controlstream_id,
						fieldIdx: schema.fields.indexOf(field),
					});
				}
			}
		}
	}
	return mapping;
});

// Fetch cs control properties
async function fetchSchemas(cs: OSHControlStream) {
	await fetchSchema(cs.controlstream).then((res) => {
		csSchema.value = res.recordSchema as SchemaFieldProperty;
		csSchema.value.controlstream_id = cs.id;
		schemas.value.push(csSchema.value);
	});
}

onMounted(() => {
	for (const ds of selectedControlstreams) {
		fetchSchemas(ds);
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
		<div v-if="csSchema">
			<v-checkbox
				v-for="mapping in fieldToCSId"
				:key="allFields[mapping.fieldIdx].definition + '-' + mapping.csID"
				:value="{csID: mapping.csID, field:allFields[mapping.fieldIdx]}"
				v-model="selectedProperties"
			>
				<template v-slot:label>
					<div class="property-row no-wrap">
						<span
							class="pa-2 property-label font-weight-bold"
							:key="allFields[mapping.fieldIdx].label"
							>{{ allFields[mapping.fieldIdx].label }}</span
						>
						<span
							class="pa-2 property-name text-grey-darken-1"
							:key="allFields[mapping.fieldIdx].name"
							>{{ allFields[mapping.fieldIdx].name }}</span
						>
						<span
							class="pa-2 property-definition text-caption text-grey"
							:key="allFields[mapping.fieldIdx].definition"
							>{{ allFields[mapping.fieldIdx].definition }}</span
						>
					</div>
				</template>
			</v-checkbox>
		</div>
		<h3 class="mb-4">Select Property</h3>
	</v-card>
</template>

<style scoped></style>
