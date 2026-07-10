<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { useSystemStore } from '@/stores/systemstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { computed, watch } from 'vue';
import { OSHControlStream, OSHDatastream } from '@/lib/OSHConnectDataStructs';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { VisualizationComponentEmits } from '../registry/VisualizationRegistry';
import { useComponentValidation } from './composables/useComponentValidation';

const props = withDefaults(
	defineProps<{
		supportsDs: boolean;
		requireDs: boolean;
		supportsCs: boolean;
		requireCs: boolean;
	}>(),
	{
		supportsDs: true,
		requireDs: true,
		supportsCs: true,
		requireCs: false,
	}
);

// Stores
const vizwizStore = useVizWizStore();
const datastreamStore = useDataStreamStore();
const controlstreamStore = useControlStreamStore();

// Update values in vizwiz store
const selectedSystems = computed({
	get: () => vizwizStore.systems,
	set: (val: string[]) => vizwizStore.setSystems(val),
});
const selectedDatastreams = computed({
	get: () => vizwizStore.datastreams,
	set: (val: OSHDatastream[]) => vizwizStore.setDatastreams(val),
});

const selectedControlstreams = computed({
	get: () => vizwizStore.controlstreams,
	set: (val: OSHControlStream[]) => vizwizStore.setControlstreams(val),
});

// List of available systems
const listSystems = useSystemStore().getFilteredSystems();
// Filter list of datastreams to include ONLY those from selected systems
const listDatastreams = computed(() => {
	if (!selectedSystems.value.length) return [];
	else return datastreamStore.getDataStreamsBySystemId(selectedSystems.value);
});

const listControlstreams = computed(() => {
	if (!selectedSystems.value.length) return [];
	else return controlstreamStore.getControlStreamsBySystemId(selectedSystems.value);
});

// Clear DATASTREAMS/CONTROLSTREAMS when systems are changed
watch(selectedSystems, () => {
	selectedDatastreams.value = [];
	selectedControlstreams.value = [];
});

// Clear DS CONFIG/CUSTOMIZE when datastreams are deselected
watch(selectedDatastreams, (newVal, oldVal) => {
	if (newVal.length < oldVal.length) {
		// Datastreams were removed
		vizwizStore.resetDsConfig();
	}
});
watch(selectedControlstreams, (newVal, oldVal) => {
	if (newVal.length < oldVal.length) {
		// Controlstreams were removed
		vizwizStore.resetCsConfig();
	}
});

// Validation: Must have at least 1 system, 1 datastream, and 1 controlstream IF required
const emit = defineEmits<VisualizationComponentEmits>();
const valid = computed(() => {
	const hasSystem = selectedSystems.value.length > 0;
	const hasDatastream = props.requireDs ? selectedDatastreams.value.length > 0 : true;
	const hasControlstream = props.requireCs ? selectedControlstreams.value.length > 0 : true;
	return hasSystem && hasDatastream && hasControlstream;
});
useComponentValidation(valid, emit);
</script>
<template>
	<!-- Select for systems -->
	<v-autocomplete
		v-model="selectedSystems"
		:items="listSystems"
		hint="Select one or more systems"
		label="System(s)*"
		multiple
		persistent-hint
		item-title="name"
		item-value="id"
		class="mb-4"
		chips
		clearable
		validate-on="blur"
		:rules="[(v: any) => !!v.length || 'At least one system must be selected']"
	></v-autocomplete>
	<!-- Select for datastreams -->
	<v-autocomplete
		v-if="props.supportsDs"
		v-model="selectedDatastreams"
		:items="listDatastreams"
		hint="Select one or more datastreams"
		:label="'Datastream(s)' + (props.requireDs ? '*' : '')"
		multiple
		persistent-hint
		item-title="name"
		:item-value="(item: OSHDatastream) => item"
		class="mb-4"
		chips
		clearable
		validate-on="blur"
		:rules="
			props.requireDs
				? [(v: any) => !!v.length || 'At least one datastream must be selected']
				: []
		"
		:disabled="!selectedSystems.length"
	></v-autocomplete>
	<!-- Select for controlstreams -->
	<v-autocomplete
		v-if="props.supportsCs"
		v-model="selectedControlstreams"
		:items="listControlstreams"
		hint="Select one or more controlstreams"
		:label="'Controlstream(s)' + (props.requireCs ? '*' : '')"
		multiple
		persistent-hint
		item-title="name"
		:item-value="(item: OSHControlStream) => item"
		chips
		clearable
		validate-on="blur"
		:rules="
			props.requireCs
				? [(v: any) => !!v.length || 'At least one controlstream must be selected']
				: []
		"
		:disabled="!selectedSystems.length"
	></v-autocomplete>
</template>
<style scoped></style>
