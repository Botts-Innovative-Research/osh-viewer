<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils';
import { onMounted, ref, watch } from 'vue';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useUIStore } from '@/stores/uistore';
import { Mode } from 'osh-js/source/core/datasource/Mode.js';
import { usePlaybackModeSync, useStartEndTimeSync } from '@/composables/DataSourceOptions';
import TimePicker from '@/components/menus/TimePicker.vue';
import DsPropertySelector from '@/components/menus/DSPropertySelector.vue';

const visualizationStore = useVisualizationStore();
const markerDS = ref<any>(null);
const selectedProperty = ref<SchemaFieldProperty | null>(null);
const obsProps = ref<{ definition: string; label: string }[]>([]);
const dsSchema = ref<any>(null);
const uiStore = useUIStore();

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
	const { ds, observedProps } = mineDatasourceObsProps();
	markerDS.value = ds;
	obsProps.value = observedProps;

	const schema = await fetchSchema(ds.datastream);
	dsSchema.value = schema;
}

onMounted(async () => {
	fetchProps();
});

// watch(selectedProperty, (val) => {
// 	emit('update:selectedProperty', val);
// });

watch(locationProp, (val) => {
	emit('update:selectedOriginProperty', val);
});

watch(headingProp, (val) => {
	emit('update:selectedHeadingProperty', val);
});
</script>

<template>
	<v-card>
		<DsPropertySelector
			title="LOB Location Origin"
			v-model:selectedProperty="locationProp"
		/>
		<DsPropertySelector
			title="LOB Heading Property"
			v-model:selectedProperty="headingProp"
		/>
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
