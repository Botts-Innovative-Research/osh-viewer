<script setup lang="ts">
import {
	fetchSchema,
	mineDatasourceObsPropsFromDS,
	SchemaFieldProperty,
} from '@/lib/DatasourceUtils';
import { OSHDatastream } from '@/lib/OSHConnectDataStructs';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
	currentDs: OSHDatastream;
	modelValue?: SchemaFieldProperty[];
}>();

const chartDS = ref<any>(null);
const selectedProperties = ref<SchemaFieldProperty[]>(props.modelValue ?? []);
const obsProps = ref<{ definition: string; label: string }[]>([]);
const dsSchema = ref<any>(null);

const emit = defineEmits(['update:modelValue']);

// Fetch datasource observed properties
async function fetchProps() {
	const { ds, observedProps } = mineDatasourceObsPropsFromDS(props.currentDs);
	chartDS.value = ds;
	obsProps.value = observedProps;

	const schema = await fetchSchema(ds.datastream);
	dsSchema.value = schema;
}

onMounted(async () => {
	fetchProps();
});

watch(
	selectedProperties,
	(val) => {
		emit('update:modelValue', val);
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
