<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

const openPanels = ref<string[]>(['general', 'sdr-options']);

const vizwizStore = useVizWizStore();
const defaultName = ref<string>('SDR Spectrum');

watch(
	() => vizwizStore.dsConfig.amplitude,
	(val) => {
		if (val && val.label) {
			defaultName.value = `${val.label} SDR`;
		}
	},
	{ immediate: true, deep: true }
);

// Form controls
const autoDb = ref<boolean>(true);
const minDb = ref<number>(-100);
const maxDb = ref<number>(-20);
const averaging = ref<number>(2);
const waterfall = ref<boolean>(true);
const waterfallSpeed = ref<number>(2);
const colorPalette = ref<string>('heat');

const averagingOptions = [
	{ title: 'Off (Raw 1x)', value: 1 },
	{ title: '2x Averaging', value: 2 },
	{ title: '4x Averaging', value: 4 },
	{ title: '8x Averaging', value: 8 },
];

const speedOptions = [
	{ title: 'Normal (1x)', value: 1 },
	{ title: 'Fast (2x)', value: 2 },
	{ title: 'Ultra (4x)', value: 4 },
];

const paletteOptions = [
	{ title: 'Heat (Standard RF)', value: 'heat' },
	{ title: 'Viridis', value: 'viridis' },
	{ title: 'Jet / Rainbow', value: 'jet' },
	{ title: 'Cool Cyan', value: 'cool' },
];

function syncToStore() {
	vizwizStore.updateVisualizationCustomizationOptions({
		autoDb: autoDb.value,
		minDb: minDb.value,
		maxDb: maxDb.value,
		averaging: averaging.value,
		waterfall: waterfall.value,
		waterfallSpeed: waterfallSpeed.value,
		colorPalette: colorPalette.value,
	});
}

watch([autoDb, minDb, maxDb, averaging, waterfall, waterfallSpeed, colorPalette], syncToStore);

onMounted(() => {
	const opts = vizwizStore.visualizationCustomizationOptions;
	if (opts.autoDb !== undefined) autoDb.value = opts.autoDb;
	if (opts.minDb !== undefined) minDb.value = opts.minDb;
	if (opts.maxDb !== undefined) maxDb.value = opts.maxDb;
	if (opts.averaging !== undefined) averaging.value = opts.averaging;
	if (opts.waterfall !== undefined) waterfall.value = opts.waterfall;
	if (opts.waterfallSpeed !== undefined) waterfallSpeed.value = opts.waterfallSpeed;
	if (opts.colorPalette !== undefined) colorPalette.value = opts.colorPalette;
	syncToStore();
});

// Validation
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const valid = computed(() => nameValid.value);
useComponentValidation(valid, emit);
</script>

<template>
	<v-expansion-panels
		rounded="lg"
		static
		multiple
		v-model="openPanels"
	>
		<v-expansion-panel
			eager
			value="general"
		>
			<v-expansion-panel-title>
				General
				<template
					v-slot:actions
					v-if="!nameValid"
				>
					<v-icon
						color="error"
						icon="mdi-alert-circle"
					>
					</v-icon>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<name-control
					:default-name="defaultName"
					v-model:valid="nameValid"
				></name-control>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel
			eager
			title="SDR Display Options"
			value="sdr-options"
		>
			<v-expansion-panel-text>
				<v-container class="pa-2">
					<v-row>
						<v-col cols="12" sm="6">
							<v-switch
								v-model="autoDb"
								label="Auto dB Range (Dynamic Floor / Ceiling)"
								color="primary"
								inset="material"
								hide-details
							/>
						</v-col>
						<v-col cols="12" sm="6">
							<v-switch
								v-model="waterfall"
								label="Show Waterfall Spectrogram"
								color="primary"
								inset="material"
								hide-details
							/>
						</v-col>
					</v-row>

					<v-row v-if="!autoDb">
						<v-col cols="12" sm="6">
							<v-slider
								v-model="minDb"
								:min="-140"
								:max="-40"
								:step="5"
								label="Min Floor (dBFS)"
								thumb-label="always"
							></v-slider>
						</v-col>
						<v-col cols="12" sm="6">
							<v-slider
								v-model="maxDb"
								:min="-60"
								:max="10"
								:step="5"
								label="Max Ceiling (dBFS)"
								thumb-label="always"
							></v-slider>
						</v-col>
					</v-row>

					<v-row>
						<v-col cols="12" sm="4">
							<v-select
								v-model="averaging"
								:items="averagingOptions"
								item-title="title"
								item-value="value"
								label="Spectrum Smoothing"
							></v-select>
						</v-col>
						<v-col cols="12" sm="4">
							<v-select
								v-model="waterfallSpeed"
								:items="speedOptions"
								item-title="title"
								item-value="value"
								label="Waterfall Speed"
								:disabled="!waterfall"
							></v-select>
						</v-col>
						<v-col cols="12" sm="4">
							<v-select
								v-model="colorPalette"
								:items="paletteOptions"
								item-title="title"
								item-value="value"
								label="Color Palette"
								:disabled="!waterfall"
							></v-select>
						</v-col>
					</v-row>
				</v-container>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>

<style scoped></style>
