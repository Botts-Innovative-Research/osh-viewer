<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, ref, watch } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../composables/useComponentValidation';
import { fetchDsSchema, mineDatasourceObsPropsFromDS } from '../../services/datasource.service';
import { getPropertyTitle, mapPropertySelection } from './propertySelection';

const props = withDefaults(
	defineProps<{
		role: string; // Property role to be used as key in vizwiz store
		multiple?: boolean; // Whether multiple properties can be selected
		showPropertySelector?: boolean;
		fixedDatastreamId?: string;
	}>(),
	{
		showPropertySelector: true,
	}
);

// Get datastreams from vizwiz store
const vizwizStore = useVizWizStore();
const listDatastreams = computed(() => {
	return vizwizStore.datastreams;
});

// Update selected datastream for this role in vizwiz store
const selectedDatastream = computed({
	get: () => props.fixedDatastreamId ?? vizwizStore.dsConfig[props.role]?.dsId,
	set: (val: string) => {
		vizwizStore.updateDsConfig(props.role, {
			dsId: val,
			property: null,
			label: null,
			uom: null,
		});
	},
});

const selectedProperty = computed({
	get: () => vizwizStore.dsConfig[props.role]?.property ?? (props.multiple ? [] : ''),
	set: (val) => {
		const fields = dsSchema.value?.recordSchema?.fields ?? [];
		if (val === null || val === undefined || val === '') return;
		const selection = mapPropertySelection(fields, val);
		if (selection) vizwizStore.updateDsConfig(props.role, selection);
	},
});

// Properties schema for selected datastream
const dsSchema = ref<any>(null);

// Fetch datasource observed properties
async function fetchProps() {
	const { ds, observedProps } = mineDatasourceObsPropsFromDS(selectedDatastream.value);
	dsSchema.value = await fetchDsSchema(ds.datastream);

	let isBinary = dsSchema.value.obsFormat === 'application/swe+binary';
	if (isBinary) {
		let compression = dsSchema.value.recordEncoding.members[1].compression;
		if (compression) vizwizStore.updateDsConfig(props.role, { compression: compression });
	}
	vizwizStore.updateDsConfig(props.role, { outputName: ds.datastream.properties.outputName });
}

// Watch for changes in selected datastream to update properties
watch(
	selectedDatastream,
	async (newVal) => {
		if (!newVal) return;
		if (vizwizStore.dsConfig[props.role]?.dsId !== newVal) {
			vizwizStore.updateDsConfig(props.role, {
				dsId: newVal,
				property: null,
				label: null,
				uom: null,
			});
		}
		await fetchProps();
	},
	{ immediate: true }
);

// Validation: must have a datastream selected, and if property selector is shown, must have property(ies) selected
const emit = defineEmits<VisualizationComponentEmits>();
const valid = computed(() => {
	// Check that a datastream is selected
	if (!selectedDatastream.value) return false;
	// If property selector is shown, check that a property is selected
	if (props.showPropertySelector) {
		return props.multiple // Check if multiple properties are allowed
			? selectedProperty.value.length > 0
			: !!selectedProperty.value;
	}
	return true;
});
useComponentValidation(valid, emit);
</script>

<template>
	<!-- Select for datastreams -->
	<v-autocomplete
		v-model="selectedDatastream"
		:items="listDatastreams"
		label="Select datastream"
		persistent-hint
		item-title="name"
		item-value="id"
		:disabled="!!props.fixedDatastreamId"
	></v-autocomplete>

	<!-- Select for property -->
	<v-expand-transition>
		<v-autocomplete
			v-if="showPropertySelector && dsSchema && dsSchema.recordSchema"
			v-model="selectedProperty"
			:items="dsSchema.recordSchema.fields"
			label="Select property"
			:item-title="(item: any) => getPropertyTitle(item, dsSchema.recordSchema.fields)"
			persistent-hint
			:chips="props.multiple"
			item-value="name"
			:multiple="props.multiple"
		></v-autocomplete>
	</v-expand-transition>
</template>

<style scoped></style>
