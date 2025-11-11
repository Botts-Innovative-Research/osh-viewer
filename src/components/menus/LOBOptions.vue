<script setup lang="ts">
	import {
		fetchSchema,
		mineDatasourceObsProps,
		SchemaFieldProperty,
	} from '@/lib/DatasourceUtils';
	import { computed, onMounted, ref, watch } from 'vue';
	import { useVisualizationStore } from '@/stores/visualizationstore';
	import { useUIStore } from '@/stores/uistore';
	import DataSourcePicker from '@/components/menus/DataSourcePicker.vue';
	import TimePicker from '@/components/menus/TimePicker.vue';
	import { useStartEndTimeSync, usePlaybackModeSync } from '@/composables/DataSourceOptions';
	import { Mode } from 'osh-js/source/core/datasource/Mode.js';
	import DataSourceDropdown from '@/components/menus//DataSourceDropdown.vue';
	import LineLayerPicker from './LineLayerPicker.vue';
	import DataSourceSelector from '@/components/menus/DataSourceSelector.vue';

	const markerDS = ref<any>(null);
	const obsProps = ref<{ definition: string; label: string }[]>([]);
	const dsSchema = ref<any>(null);

	const selectedLocation = ref<SchemaFieldProperty | null>(null);
	const selectedLOB = ref<SchemaFieldProperty | null>(null);
	const selectedLobProps = ref<SchemaFieldProperty | null>(null);

	const emit = defineEmits(['update:layerProperties']);

	async function fetchProps() {
		const { ds, observedProps } = mineDatasourceObsProps();
		markerDS.value = ds;
		obsProps.value = observedProps;

		// const schema = await fetchSchema(ds.datastream)
		// dsSchema.value = schema
		const schemas: any[] = [];
		for (const dss of ds) {
			const schema = await fetchSchema(dss.datastream);
			schemas.push(schema);
		}
		console.log('schemas:', schemas);

		dsSchema.value = schemas;
	}

	onMounted(async () => {
		fetchProps();
	});

	const LineLayerProperties = computed(() => {
		if (!selectedLocation.value || !selectedLOB.value || !selectedLobProps.value) {
			return null;
		}

		return {
			location: selectedLocation.value.name,
			bearing: selectedLOB.value.name,
			color: selectedLobProps.value.color,
			weight: selectedLobProps.value.weight,
			opacity: selectedLobProps.value.opacity,
			distanceKm: selectedLobProps.value.length,
		};
	});

	watch(
		[selectedLocation, selectedLOB, selectedLobProps],
		() => {
			emit('update:layerProperties', LineLayerProperties.value);
		},
		{ deep: true, immediate: true }
	);

	onMounted(() => {
		emit('update:layerProperties', LineLayerProperties.value);
	});
</script>

<template>
	<v-card>
		<DataSourceDropdown title="Location" v-model:selectedProperty="selectedLocation" />
		<DataSourceDropdown title="Line of Bearing" v-model:selectedProperty="selectedLOB" />
		<LineLayerPicker
			title="Select Line Options for Line of Bearing"
			v-model:lobLineProperties="selectedLobProps" />
	</v-card>
</template>

<style scoped></style>
