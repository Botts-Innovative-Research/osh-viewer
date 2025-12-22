<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { nextTick, ref } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useUIStore } from '@/stores/uistore';

const props = defineProps<{
	onAddChart: () => void;
	observedProperties: any[];
	dsName: string;
}>();

const isOpen = ref<boolean>(false);
const visualizationStore = useVisualizationStore();
// const visualizations = ref<VisualizationMetadata[]>([])
const chartDS = ref<any>(null);
// const selectedProperty = ref<{ 'definition': string, 'label': string } | null>(null)
const selectedProperty = ref<SchemaFieldProperty | null>(null);
const obsProps = ref<{ definition: string; label: string }[]>([]);
const dsSchema = ref<any>(null);
const uiStore = useUIStore();

async function fetchProps() {
	const { ds, observedProps } = mineDatasourceObsProps();
	chartDS.value = ds;
	obsProps.value = observedProps;

	const schema = await fetchSchema(ds.datastream);
	console.log('[AddChartModal] Schema fetched:', schema);
	dsSchema.value = schema;
	// await nextTick()
	console.log('[AddChartModal] dsSchema:', dsSchema.value);
}

function addChart() {
	if (selectedProperty.value) {
		console.log('property found:', selectedProperty.value);

		const oViz = new OSHVisualization(
			'chart-' + randomUUID(),
			'chart-' + randomUUID(),
			'chart',
			null,
			chartDS.value
		);

		visualizationStore.addVisualization(oViz);
		uiStore.setSelectedProperty(selectedProperty.value);
		isOpen.value = false;
		return;
	}
}
</script>

<template>
	<v-dialog v-model="isOpen">
		<template v-slot:activator="{ props: activatorProps }">
			<v-btn v-bind="activatorProps" @click="fetchProps"> Add Chart </v-btn>
		</template>

		<template v-slot:default="{ isActive }">
			<v-card class="pa-6">
				<v-radio-group v-model="selectedProperty" v-if="dsSchema">
					<v-radio disabled :value="null">
						<template v-slot:label>
							<div class="property-row no-wrap">
								<span class="property-label font-weight-bold">Label</span>
								<span class="property-name">Name</span>
								<span class="property-definition">Definition</span>
							</div>
						</template>
					</v-radio>
					<v-radio
						v-for="property in dsSchema.recordSchema.fields"
						:key="property.definition"
						:value="property"
					>
						<template v-slot:label>
							<div class="property-row no-wrap">
								<span class="property-label font-weight-bold">{{
									property.label
								}}</span>
								<span class="property-name text-grey-darken-1">{{
									property.name
								}}</span>
								<span class="property-definition text-caption text-grey">{{
									property.definition
								}}</span>
							</div>
						</template>
					</v-radio>
				</v-radio-group>

				<v-row class="button-row" justify="center" align="center" no-gutters>
					<v-col cols="auto" class="mr-2">
						<v-btn @click="isOpen = false" size="default">Close</v-btn>
					</v-col>
					<v-col cols="auto">
						<v-btn @click="addChart" size="default" color="primary">Submit</v-btn>
					</v-col>
				</v-row>
			</v-card>
		</template>
	</v-dialog>
</template>

<style scoped>
.property-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	gap: 16px;
}
.property-label {
	flex: 0 0 160px;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.property-name {
	flex: 0 0 160px;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.property-definition {
	flex: 1 1 0;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.no-wrap {
	white-space: nowrap;
}
.button-row {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 0;
	margin-top: 12px;
}
</style>
