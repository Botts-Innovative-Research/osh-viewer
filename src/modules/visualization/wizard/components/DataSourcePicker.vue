<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, onMounted, ref, watch } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../composables/useComponentValidation';
import { fetchDsSchema, mineDatasourceObsPropsFromDS } from '../../services/datasource.service';

const props = withDefaults(
	defineProps<{
		role: string; // Property role to be used as key in vizwiz store
		multiple?: boolean; // Whether multiple properties can be selected
		showPropertySelector?: boolean;
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
	get: () => vizwizStore.dsConfig[props.role]?.dsId,
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
	get: () => vizwizStore.dsConfig[props.role]?.label ?? (props.multiple ? [] : ''),
	set: (val) => {
		const fields = dsSchema.value?.recordSchema?.fields ?? [];

		// Helper to get the display value (label or name)
		const display = (f: any) => f.label ?? f.name;

		if (Array.isArray(val)) {
			// Multi-select: match by label OR name
			const selected = fields.filter((f: any) => val.includes(display(f)));

			vizwizStore.updateDsConfig(props.role, {
				property: selected.map((f: any) => f.name),
				label: selected.map(display),
				uom: selected.map((f: any) => f.uom?.code ?? ''),
			});
		} else if (val) {
			// Single-select: match by label OR name
			const field = fields.find((f: any) => display(f) === val);
			if (!field) return;

			vizwizStore.updateDsConfig(props.role, {
				property: field.name,
				label: display(field),
				uom: field.uom?.code ?? '',
			});
		}
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
watch(selectedDatastream, async (newVal) => {
	if (!newVal) return;
	await fetchProps();
});

// If already selected datastream on mount (edit viz), fetch props
onMounted(async () => {
	if (selectedDatastream.value) {
		await fetchProps();
	}
});

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
	></v-autocomplete>

	<!-- Select for property -->
	<v-expand-transition>
		<v-autocomplete
			v-if="showPropertySelector && dsSchema && dsSchema.recordSchema"
			v-model="selectedProperty"
			:items="dsSchema.recordSchema.fields"
			label="Select property"
			:item-title="(item: any) => item.label ?? item.name"
			persistent-hint
			:chips="props.multiple"
			:item-value="(item: any) => item.label ?? item.name"
			:multiple="props.multiple"
		></v-autocomplete>
	</v-expand-transition>
</template>

<style scoped></style>
