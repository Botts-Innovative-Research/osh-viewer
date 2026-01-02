<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const emit = defineEmits(['update:color', 'update:opacity', 'update:distanceKm', 'update:weight']);

const color = ref<string>('#ff0000ff');
const weight = ref<number>(10);
const opacity = ref<number>(0.5);
const distanceKm = ref<number>(1);

watch(color, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ color: val });
});

watch(weight, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ weight: val });
});

watch(opacity, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ opacity: val });
});

watch(distanceKm, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ distanceKm: val });
});

onMounted(() => {
	vwStore.updateVisualizationCustomizationOptions({
		color: color.value,
		weight: weight.value,
		opacity: opacity.value,
		distanceKm: distanceKm.value,
	});
});
</script>

<template>
	<v-card class="pa-4" elevation="2">
		<v-card class="pa-4" elevation="2">
			<h3>Color</h3>
			<v-color-picker style="margin: auto" v-model="color" mode="rgba"> </v-color-picker>
		</v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Weight</h3>
			<v-slider v-model="weight" :min="1" :max="20" step="0.5">
				<template v-slot:append>
					<span>{{ weight }}</span>
				</template>
			</v-slider>
		</v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Opacity</h3>
			<v-slider v-model="opacity" :min="0" :max="1" step="0.01">
				<template v-slot:append>
					<span>{{ (opacity * 100).toFixed(0) }}%</span>
				</template>
			</v-slider>
		</v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Distance (Km)</h3>
			<v-slider v-model="distanceKm" :min="0" :max="100" step="0.1">
				<template v-slot:append>
					<span>{{ distanceKm }} km</span>
				</template>
			</v-slider>
		</v-card>
	</v-card>
</template>
