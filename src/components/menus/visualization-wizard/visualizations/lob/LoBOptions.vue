<script setup lang="ts">
import {
	fetchSchema,
	mineDatasourceObsPropsFromDS,
	SchemaFieldProperty,
} from '@/lib/DatasourceUtils';
import { computed, onMounted, ref, watch } from 'vue';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { usePlaybackModeSync, useStartEndTimeSync } from '@/composables/DataSourceOptions';
import TimePicker from '@/components/menus/TimePicker.vue';
import NewDataSourcePicker from '@/components/menus/visualization-wizard/viz-components/NewDataSourcePicker.vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import ModePicker from '@/components/menus/visualization-wizard/viz-components/ModePicker.vue';
import { DatasourceOptions } from '@/lib/visualization/wizard/Datasources/DatasourceOptions';

const visualizationStore = useVisualizationStore();
const markerDS = ref<any>(null);
const selectedProperty = ref<SchemaFieldProperty | null>(null);
const obsProps = ref<{ definition: string; label: string }[]>([]);
const dsSchema = ref<any>(null);
const selDatastreams = useVizWizStore().datastreams;
const datastream = useVizWizStore().datastreams[0];
const vizWizStore = useVizWizStore();

const selectedHeadingProperty = ref<SchemaFieldProperty | null>(null);

// const locationProp = defineModel('selectedLocationProperty');
const locationProp = ref<{ dsID: string; field: SchemaFieldProperty | null }[]>([]);
// const headingProp = defineModel('selectedHeadingProperty');
const headingProp = ref<{ dsID: string; field: SchemaFieldProperty | null }[]>([]);

const startTime = ref<string | null>(null);
const endTime = ref<string | null>(null);
const playbackMode = ref<any>(null);

// TODO: complete datasource options sync
const datasourceOptions = computed({
	get: () => vizWizStore.dsConfig,
	set: (val) => {
		vizWizStore.updateDsConfig('', val);
	},
});

useStartEndTimeSync(startTime, endTime, visualizationStore);
usePlaybackModeSync(playbackMode, visualizationStore);

const emit = defineEmits(['update:selectedOriginProperty', 'update:selectedHeadingProperty']);

const selectedProperties = computed(() => {
	return [selectedProperty.value, selectedHeadingProperty.value];
});
const locationDSoptions = computed(() => {
	if (!selectedProperty.value) {
		return null;
	}

	return new DatasourceOptions(
		selectedProperty.value?.datastream_id || '',
		startTime.value || '',
		endTime.value || '',
		playbackMode.value,
		selectedProperty.value.definition
	);
});

const headingDSoptions = computed(() => {
	if (!selectedHeadingProperty.value) {
		return null;
	}

	return new DatasourceOptions(
		selectedHeadingProperty.value?.datastream_id || '',
		startTime.value || '',
		endTime.value || '',
		playbackMode.value,
		selectedHeadingProperty.value.definition
	);
});

async function fetchProps() {
	const { ds, observedProps } = mineDatasourceObsPropsFromDS(datastream);
	markerDS.value = ds;
	obsProps.value = observedProps;

	const schema = await fetchSchema(ds.datastream);
	dsSchema.value = schema;
}

onMounted(async () => {
	fetchProps();
});

watch(locationProp, (val: { dsID: string; field: SchemaFieldProperty | null }[]) => {
	emit('update:selectedOriginProperty', val);
	if (val.length === 1) {
		let dsRef = val[0];
		if (!dsRef.field) return;
		vizWizStore.updateDsConfig(dsRef.dsID, {
			resource_id: dsRef.dsID,
			property_name: dsRef.field.name,
		});
	}
});

watch(headingProp, (val: { dsID: string; field: SchemaFieldProperty | null }[]) => {
	emit('update:selectedHeadingProperty', val);
	if (val.length === 1) {
		let dsRef = val[0];
		if (!dsRef.field) return;
		vizWizStore.updateDsConfig(dsRef.dsID, {
			resource_id: dsRef.dsID,
			property_name: dsRef.field.name,
		});
	}
});

watch(startTime, (val) => {
	vizWizStore.updateDsConfig('', {});
});

function updateSelectedLocProperty(property: any) {
	console.log('[LoBOptions] Selected Location Property:', property);
	if (property.length === 1) {
		let dsRef = property[0];
		if (!dsRef.field) return;
		vizWizStore.updateDsConfig(dsRef.dsID, {
			locProp: {
				resource_id: dsRef.dsID,
				property_name: dsRef.field.name,
			},
		});
	}
}

function updateSelectedHeadingProperty(property: any) {
	console.log('[LoBOptions] Selected Heading Property:', property);
	if (property.length === 1) {
		let dsRef = property[0];
		if (!dsRef.field) return;
		vizWizStore.updateDsConfig(dsRef.dsID, {
			headingProp: {
				resource_id: dsRef.dsID,
				property_name: dsRef.field.name,
			},
		});
	}
}

function updateStartTime(time: string) {
	console.log('[LoBOptions] Selected Start Time:', time);
	vizWizStore.updateGlobalConfig({startTime: time});
}

function updateEndTime(time: string) {
	console.log('[LoBOptions] Selected End Time:', time);
	vizWizStore.updateGlobalConfig({endTime: time});
}

function updatePlaybackMode(mode: string) {
	console.log('[LoBOptions] Selected Playback Mode:', mode);
	vizWizStore.updateGlobalConfig({playbackMode: mode});
}

watch(startTime, (val) => {
	if (!val) return;
	updateStartTime(val);
});

watch(endTime, (val) => {
	if (!val) return;
	updateEndTime(val);
});

watch(playbackMode, (val) => {
	if (!val) return;
	updatePlaybackMode(val);
});
</script>

<template>
	<v-card>
		<NewDataSourcePicker @update:selectedProperty="updateSelectedLocProperty" />
		<NewDataSourcePicker @update:selectedProperty="updateSelectedHeadingProperty" />
		<TimePicker title="Start Time" v-model:formattedDate="startTime" />
		<TimePicker title="End Time" v-model:formattedDate="endTime" />
		<ModePicker v-model="playbackMode" />
	</v-card>
</template>

<style scoped></style>
