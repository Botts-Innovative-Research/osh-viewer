<script setup lang="ts">
import { mineDatasourceObsProps } from '@/lib/DatasourceUtils';
import { fetchControlStreamSchema } from '@/lib/ControlstreamUtils';
import { onMounted, ref } from 'vue';
import { useUIStore } from '@/stores/uistore';
import { OSHControlStream } from '@/lib/OSHConnectDataStructs';
import { computed, PropType } from 'vue';

// Control Stream Options
const selectedControlStream = defineModel('selectedControlStream', {
	type: Object as PropType<OSHControlStream>,
	default: null,
});
const controlStreams = computed(() => {
	const uiStore = useUIStore();
	return uiStore.selectedDatastream?.getParentSystem().getCSChildren() || [];
});
const csSchemas = ref<{ [key: string]: any }>({});

const obsProps = ref<{ definition: string; label: string }[]>([]);

async function fetchProps() {
	const { ds, observedProps } = mineDatasourceObsProps();

	// Fetch control stream schemas
	for (const cs of controlStreams.value) {
		const csSchema = await fetchControlStreamSchema(cs, ds.datastream.networkProperties);
		csSchemas.value[cs.id] = csSchema;
	}
}

onMounted(async () => {
	fetchProps();
});
</script>

<template>
	<v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Control Streams</h3>
			<v-radio-group v-model="selectedControlStream">
				<v-radio v-for="cs in controlStreams" :key="cs.id" :value="cs" :label="cs.name">
					<template #label>
						<div>
							<p>{{ cs.name || 'Unnamed Stream' }}</p>
							<div class="text-caption text-grey"></div>
							<div v-if="csSchemas[cs.id]" class="mt-1 teåxt-body-2">
								<p style="overflow: auto">
									{{ Object.keys(csSchemas[cs.id]) }}
								</p>
							</div>
						</div>
					</template>
				</v-radio>
			</v-radio-group>
		</v-card>
	</v-card>
</template>

<style scoped></style>
