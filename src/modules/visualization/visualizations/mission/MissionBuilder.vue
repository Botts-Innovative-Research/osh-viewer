<script lang="ts" setup>
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useMapStore } from '@/stores/mapstore';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import PanelVisualizationWrapper from '../../sidebar/components/PanelVisualizationWrapper.vue';
import PlanMission from './PlanMission.vue';
import {
	createDatasource,
	disconnectDatasources,
	getLatestObservation,
} from '@/modules/visualization/services/datasource.service';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { VisualizationComponents } from '../../types/visualization';
import type { IConSysApiControlStreamProperties } from '../../types/datasource';
import { IConSysApiDataSourceProperties } from '@/modules/visualization/types/datasource';

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

const activeVisualization = computed(() => {
	if (!props.visualizations.length) return null;
	const viz = props.visualizations[0];
	if (Array.isArray(viz.visualizationComponents)) return null;
	return viz;
});

const datasources = computed(() => {
	if (!activeVisualization.value) return [];
	return (
		(activeVisualization.value.visualizationComponents as VisualizationComponents).dataSource ??
		[]
	);
});

const controlstreams = computed(() => {
	if (!activeVisualization.value) return [];
	return (
		(activeVisualization.value.visualizationComponents as VisualizationComponents)
			.controlstream ?? []
	);
});

function getControlstreamByRole(role: string) {
	return controlstreams.value.find((cs: any) => cs.properties && cs.properties[role]);
}


const missionControlStream = computed<IConSysApiControlStreamProperties | undefined>(
	() => getControlstreamByRole('roverPlan') ?? getControlstreamByRole('plan')
);

const noController = computed(() => props.visualizations.length === 0);

const activeTab = ref<'plan' | 'control'>('plan');
const minimapViewActive = ref(false);

interface LLAData {
	lat: number;
	lon: number;
	alt: number;
}

const minimapViz = computed(() =>
	activeVisualization.value?.children?.find((c: OSHVisualization) => c.type === 'minimap') ?? null
);


const receivedLLA = ref<LLAData>({ lat: 0, lon: 0, alt: 0 });
const receivedStatus = ref("");

const llaDatasource = ref<typeof ConSysApi | null>(null);
const homeDatasource = ref<typeof ConSysApi | null>(null);
const statusDatasource = ref<typeof ConSysApi | null>(null);
let dsInstances = ref<(typeof ConSysApi)[]>([]);

let homeLocation = ref<{ lat: number; lon: number; alt: number }>({ lat: 0, lon: 0, alt: 0 });

function onStatusListener(dsInstance: typeof ConSysApi, ds: IConSysApiDataSourceProperties) {
  const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

  dataBroadcastChannel.onmessage = (message) => {
    if (message.data.type === 'data') {
      const data = message.data.values[0].data;
      receivedStatus.value = data[ds.properties.status.property];
    }
  };
}


function onLLAListener(dsInstance: typeof ConSysApi, ds: IConSysApiDataSourceProperties) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			receivedLLA.value = {
				lat: data[ds.properties.lla.property].lat ?? 0,
				lon: data[ds.properties.lla.property].lon ?? 0,
				alt: data[ds.properties.lla.property].alt ?? 0,
			};
		}
	};
}

function onHomeLocationListener(dsInstance: typeof ConSysApi, ds: IConSysApiDataSourceProperties) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			homeLocation.value = {
				lat: data[ds.properties.home.property].lat ?? 0,
				lon: data[ds.properties.home.property].lon ?? 0,
				alt: data[ds.properties.home.property].alt ?? 0,
			};
		}
	};
}

function cleanupDatasources() {
	if (llaDatasource.value) disconnectDatasources(llaDatasource);
	if (homeDatasource.value) disconnectDatasources(homeDatasource);
	if (statusDatasource.value) disconnectDatasources(statusDatasource);
	llaDatasource.value = null;
  homeDatasource.value = null;
  statusDatasource.value = null;
	dsInstances.value.forEach((ds) => ds.disconnect());
	dsInstances.value = [];
}

async function connectDatasources() {
	for (const ds of datasources.value) {
		let dsInstance = createDatasource(ds);
		dsInstance.connect();

		if (ds?.properties?.home) {
			homeDatasource.value = dsInstance;
			let homeLLAResults = await getLatestObservation(ds);
      const homeData = homeLLAResults.result;
      if (homeData) {
        homeLocation.value = {
          lat: homeData[ds.properties.home.property].lat,
          lon: homeData[ds.properties.home.property].lon,
          alt: homeData[ds.properties.home.property].alt,
        };
      }
			onHomeLocationListener(dsInstance, ds);
		} else if (ds?.properties?.lla) {
			llaDatasource.value = dsInstance;
			onLLAListener(dsInstance, ds);
		} else if (ds?.properties.status) {
      statusDatasource.value = dsInstance;
      onStatusListener(dsInstance, ds);
    }

		dsInstances.value.push(dsInstance);
	}
}

watch(
	activeVisualization,
	async () => {
		cleanupDatasources();
		if (!activeVisualization.value) return;
		await connectDatasources();
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	cleanupDatasources();
});
useVisualizationCleanup(dsInstances);

const hasCommandPad = computed(
	() =>
		getControlstreamByRole('land') ||
		getControlstreamByRole('pause') ||
		getControlstreamByRole('rtl') ||
		getControlstreamByRole('offboard') ||
		getControlstreamByRole('takeoff') ||
		getControlstreamByRole('driveVelocity') ||
		getControlstreamByRole('driveLocation') ||
		getControlstreamByRole('arm') ||
		getControlstreamByRole('reboot') ||
		getControlstreamByRole('hold') ||
		getControlstreamByRole('homePos') ||
		getControlstreamByRole('driveMode')
);
</script>

<template>
	<v-container
		class="py-4"
		fluid
	>
		<v-row
			class="d-flex align-center"
			no-gutters
		>
			<v-col>
				<slot name="controllers"></slot>
				<p class="text-caption text-grey mt-1">
					Select a controller to build and send missions.
				</p>
			</v-col>
		</v-row>
		<v-divider v-if="!noController"></v-divider>

    <v-sheet v-if="!noController">
      <v-card v-if="minimapViewActive && minimapViz" class="minimap-card">
        <div class="d-flex align-center justify-space-between px-2 pt-1">
          <span class="text-caption font-weight-medium">Mini Map</span>
        </div>
        <PanelVisualizationWrapper :viz="minimapViz" />
      </v-card>
      <v-card class="telemetry-card">
        <v-card-text>Live Telemetry</v-card-text>
        <v-row density="comfortable">
          <v-col
              cols="12"
              md="4"
          >
            <v-card-subtitle>Latitude</v-card-subtitle>
            <v-card-title>{{ receivedLLA.lat.toFixed(6) }}</v-card-title>
          </v-col>
          <v-col
              cols="12"
              md="4"
          >
            <v-card-subtitle>Longitude</v-card-subtitle>
            <v-card-title>{{ receivedLLA.lon.toFixed(6) }}</v-card-title>
          </v-col>
          <v-col
              cols="12"
              md="4"
          >
            <v-card-subtitle>Altitude</v-card-subtitle>
            <v-card-title>{{ receivedLLA.alt.toFixed(2) }}</v-card-title>
          </v-col>
        </v-row>
      </v-card>

      <v-card class="status-card">
        <v-card-text class="d-flex align-center">
          <span class="text-subtitle-2 font-weight-medium mr-2">Status:</span>
          <span class="text-title-large">{{ receivedStatus || 'N/A' }}</span>
        </v-card-text>
      </v-card>
    </v-sheet>

		<v-sheet
			v-if="!noController"
			class="pa-0 d-flex flex-column"
		>
			<v-tabs
				v-model="activeTab"
				class="mb-2"
				color="primary"
				grow
			>
				<v-tab value="plan">
					<span>Plan</span>
				</v-tab>
				<v-tab value="control">
					<span>Control</span>
				</v-tab>
			</v-tabs>

			<v-window v-model="activeTab">
				<v-window-item value="plan">
					<PlanMission
						:home-location="homeLocation"
						:mission-control-stream="missionControlStream"
						:no-controller="noController"
					/>
				</v-window-item>

				<v-window-item value="control">
					<v-card v-if="hasCommandPad">
						<MissionCommandPad :controlstreams="controlstreams" />
					</v-card>
				</v-window-item>
			</v-window>
		</v-sheet>
	</v-container>
</template>

<style scoped>
.minimap-card {
	height: 425px;
	overflow: hidden;
}
</style>
