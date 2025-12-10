<script setup lang="ts">
import {
	fetchSchema,
	mineDatasourceObsProps,
	mineDatasourceObsPropsFromDS,
	SchemaFieldProperty,
} from '@/lib/DatasourceUtils';
import { onMounted, ref, watch } from 'vue';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useUIStore } from '@/stores/uistore';
import { Mode } from 'osh-js/source/core/datasource/Mode.js';
import { usePlaybackModeSync, useStartEndTimeSync } from '@/composables/DataSourceOptions';
import TimePicker from '@/components/menus/TimePicker.vue';
import DataSourcePicker from '@/components/menus/visualization-wizard/viz-components/DataSourcePicker.vue';
import NewDataSourcePicker from '@/components/menus/visualization-wizard/viz-components/NewDataSourcePicker.vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const visualizationStore = useVisualizationStore();
const markerDS = ref<any>(null);
const selectedProperty = ref<SchemaFieldProperty | null>(null);
const obsProps = ref<{ definition: string; label: string }[]>([]);
const dsSchema = ref<any>(null);
const uiStore = useUIStore();
const datastream = useVizWizStore().datastreams[0];

const selectedLocationProperty = ref<SchemaFieldProperty | null>(null);
const selectedHeadingProperty = ref<SchemaFieldProperty | null>(null);
const selectedLobProps = ref<SchemaFieldProperty | null>(null);

const locationProp = defineModel('selectedLocationProperty');
const headingProp = defineModel('selectedHeadingProperty');

const startTime = ref<string | null>(null);
const endTime = ref<string | null>(null);
const playbackMode = ref(Mode.REPLAY);
const playbackModes = Object.entries(Mode).map(([key, value]) => ({
	label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
	value,
}));

useStartEndTimeSync(startTime, endTime, visualizationStore);
usePlaybackModeSync(playbackMode, visualizationStore);

const emit = defineEmits(['update:selectedOriginProperty', 'update:selectedHeadingProperty']);

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

watch(locationProp, (val) => {
	emit('update:selectedOriginProperty', val);
});

watch(headingProp, (val) => {
	emit('update:selectedHeadingProperty', val);
});

function updateSelectedLocProperty(property: SchemaFieldProperty) {
	console.log('[LoBOptions] Selected Location Property:', property);
	selectedProperty.value = property;
}

function updateSelectedHeadingProperty(property: SchemaFieldProperty) {
	console.log('[LoBOptions] Selected Heading Property:', property);
	selectedHeadingProperty.value = property;
}
</script>

<template>
	<v-card>
		<!--		<DataSourcePicker current-ds="datastream" v-model="selectedPropertiesByDs[datastream.id]" />-->
		<NewDataSourcePicker @update:selectedProperty="updateSelectedLocProperty" />
		<NewDataSourcePicker @update:selectedProperty="updateSelectedHeadingProperty" />
		<TimePicker title="Start Time" v-model:formattedDate="startTime" />
		<TimePicker title="End Time" v-model:formattedDate="endTime" />
		<v-combobox
			v-model="playbackMode"
			:items="playbackModes"
			item-title="label"
			item-value="value"
			label="Playback Mode"
			variant="solo"
			density="compact"
		/>
	</v-card>
</template>

<style scoped></style>
