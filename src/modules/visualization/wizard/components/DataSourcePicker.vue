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
		flatLocation?: boolean; // Use separate lat/lon/alt field selectors instead of a single Location object
	}>(),
	{
		showPropertySelector: true,
		flatLocation: false,
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

const currentFields = computed(() => {
	return (
		dsSchema.value?.recordSchema?.fields ||
		dsSchema.value?.resultSchema?.fields ||
		dsSchema.value?.fields ||
		[]
	);
});

const selectedProperty = computed({
	get: () => vizwizStore.dsConfig[props.role]?.label ?? (props.multiple ? [] : ''),
	set: (val) => {
		const fields = currentFields.value;

		// Helper to get the display value (label or name)
		const display = (f: any) => f.label ?? f.name;

		if (Array.isArray(val)) {
			// Multi-select: match by label OR name
			const selected = fields.filter((f: any) => val.includes(display(f)) || val.includes(f.name));

			vizwizStore.updateDsConfig(props.role, {
				property: selected.map((f: any) => f.name),
				label: selected.map(display),
				uom: selected.map((f: any) => f.uom?.code ?? ''),
			});
		} else if (val) {
			// Single-select: match by label OR name
			const field = fields.find((f: any) => display(f) === val || f.name === val);
			if (!field) return;

			vizwizStore.updateDsConfig(props.role, {
				property: field.name,
				label: display(field),
				uom: field.uom?.code ?? '',
			});
		}
	},
});

const selectedLatProperty = computed({
	get: () => {
		const prop = vizwizStore.dsConfig[props.role]?.property;
		return typeof prop === 'object' && prop?.lat ? prop.lat : '';
	},
	set: (val: string) => {
		const currentProp = vizwizStore.dsConfig[props.role]?.property;
		const base = typeof currentProp === 'object' ? currentProp : {};
		vizwizStore.updateDsConfig(props.role, {
			property: { ...base, lat: val },
			locationFormat: 'flat',
			label: 'Lat/Lon/Alt',
		});
	},
});

const selectedLonProperty = computed({
	get: () => {
		const prop = vizwizStore.dsConfig[props.role]?.property;
		return typeof prop === 'object' && prop?.lon ? prop.lon : '';
	},
	set: (val: string) => {
		const currentProp = vizwizStore.dsConfig[props.role]?.property;
		const base = typeof currentProp === 'object' ? currentProp : {};
		vizwizStore.updateDsConfig(props.role, {
			property: { ...base, lon: val },
			locationFormat: 'flat',
			label: 'Lat/Lon/Alt',
		});
	},
});

const selectedAltProperty = computed({
	get: () => {
		const prop = vizwizStore.dsConfig[props.role]?.property;
		return typeof prop === 'object' && prop?.alt ? prop.alt : '';
	},
	set: (val: string) => {
		const currentProp = vizwizStore.dsConfig[props.role]?.property;
		const base = typeof currentProp === 'object' ? currentProp : {};
		vizwizStore.updateDsConfig(props.role, {
			property: { ...base, alt: val || null },
			locationFormat: 'flat',
			label: 'Lat/Lon/Alt',
		});
	},
});

// Properties schema for selected datastream
const dsSchema = ref<any>(null);

// Fetch datasource observed properties
async function fetchProps() {
	const { ds, observedProps } = mineDatasourceObsPropsFromDS(selectedDatastream.value);
	if (!ds || !ds.datastream) return;

	try {
		dsSchema.value = await fetchDsSchema(ds.datastream);
	} catch (e) {
		console.error('[DataSourcePicker] Error fetching schema:', e);
		dsSchema.value = null;
	}

	if (dsSchema.value?.obsFormat === 'application/swe+binary') {
		let compression = dsSchema.value.recordEncoding?.members?.[1]?.compression;
		if (compression) vizwizStore.updateDsConfig(props.role, { compression: compression });
	}
	if (ds.datastream?.properties?.outputName) {
		vizwizStore.updateDsConfig(props.role, { outputName: ds.datastream.properties.outputName });
	}

	const fields = currentFields.value;

	// Auto-select property if none is selected yet and schema fields are available
	if (!vizwizStore.dsConfig[props.role]?.property && fields.length > 0) {
		const display = (f: any) => f.label ?? f.name;

		const roleLower = props.role.toLowerCase();
		const match =
			fields.find((f: any) => {
				const fn = (f.name || '').toLowerCase();
				const fl = (f.label || '').toLowerCase();
				return (
					fn === roleLower ||
					fl === roleLower ||
					(roleLower.includes('loc') && (fn === 'location' || fn === 'pos' || fl === 'location' || fn.includes('loc') || fn.includes('pos'))) ||
					(roleLower.includes('marker') && (fn.includes('icao') || fn.includes('mmsi') || fn.includes('id') || fl.includes('icao') || fl.includes('mmsi'))) ||
					(roleLower.includes('label') && (fn.includes('callsign') || fn.includes('vessel') || fn.includes('name') || fl.includes('callsign') || fl.includes('name'))) ||
					(roleLower.includes('orient') && (fn.includes('heading') || fn.includes('track') || fn.includes('cog') || fl.includes('heading') || fl.includes('track'))) ||
					(roleLower.includes('amp') && !fn.includes('time') && !fl.includes('time') && !fn.includes('count') && !fn.includes('size') && (fn.includes('amplitude') || fn === 'amp' || fn.includes('spectrum') || fn.includes('psd') || fl.includes('amplitude') || fl.includes('spectrum') || fl.includes('psd'))) ||
					(roleLower.includes('centerfreq') && !fn.includes('count') && !fn.includes('size') && (fn.includes('center') || fl.includes('center'))) ||
					(roleLower.includes('frequencyaxis') && !fn.includes('count') && !fn.includes('size') && (fn.includes('axis') || fl.includes('axis'))) ||
					(roleLower.includes('freq') && !fn.includes('count') && !fn.includes('size') && (fn.includes('freq') || fl.includes('freq'))) ||
					(roleLower.includes('rate') && !fn.includes('time') && !fl.includes('time') && (fn.includes('rate') || fl.includes('rate') || fn.includes('span') || fn.includes('bandwidth'))) ||
					(roleLower.includes('video') && (fn.includes('video') || fn.includes('image') || fl.includes('video'))) ||
					(roleLower.includes('sample') && !roleLower.includes('rate') && !fn.includes('time') && !fl.includes('time') && (fn.includes('audio') || fn.includes('samples') || fn === 'sample'))
				);
			}) || (fields.length === 1 ? fields[0] : null);

		if (match) {
			vizwizStore.updateDsConfig(props.role, {
				property: props.multiple ? [match.name] : match.name,
				label: props.multiple ? [display(match)] : display(match),
				uom: match.uom?.code ?? '',
			});
		}
	}
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
	if (props.flatLocation) {
		return !!selectedLatProperty.value && !!selectedLonProperty.value;
	}
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
			v-if="!props.flatLocation && showPropertySelector && currentFields.length > 0"
			v-model="selectedProperty"
			:items="currentFields"
			label="Select property"
			:item-title="(item: any) => item.label ?? item.name"
			persistent-hint
			:chips="props.multiple"
			:item-value="(item: any) => item.label ?? item.name"
			:multiple="props.multiple"
		></v-autocomplete>
	</v-expand-transition>
	<v-expand-transition>
		<div v-if="props.flatLocation && currentFields.length > 0">
			<v-autocomplete
				v-model="selectedLatProperty"
				:items="currentFields"
				label="Latitude property"
				:item-title="(item: any) => item.label ?? item.name"
				:item-value="(item: any) => item.name"
				persistent-hint
			/>
			<v-autocomplete
				v-model="selectedLonProperty"
				:items="currentFields"
				label="Longitude property"
				:item-title="(item: any) => item.label ?? item.name"
				:item-value="(item: any) => item.name"
				persistent-hint
			/>
			<v-autocomplete
				v-model="selectedAltProperty"
				:items="currentFields"
				label="Altitude property (optional)"
				:item-title="(item: any) => item.label ?? item.name"
				:item-value="(item: any) => item.name"
				persistent-hint
				clearable
			/>
		</div>
	</v-expand-transition>
</template>

<style scoped></style>
