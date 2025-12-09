<script setup lang="ts">

import { watch } from 'vue';

const emit = defineEmits([
	'update:color',
	'update:opacity',
	'update:distanceKm',
	'update:weight',
]);

const color = defineModel('color', {
	type: String,
	default: '#ff0000ff',
});

const weight = defineModel('weight', {
	type: Number,
	default: 10,
});

const opacity = defineModel('opacity', {
	type: Number,
	default: 0.5,
});

const distanceKm = defineModel('distanceKm', {
	type: Number,
	default: 1,
});

const visualizationOptions = defineModel('visualizationOptions', {
	type: Object,
	default: () => ({
		color: '#ff0000ff',
		weight: 10,
		opacity: 0.5,
		distanceKm: 1,
	}),
});

watch(color, (val) => {
	emit('update:color', val);
});

watch(weight, (val) => {
	emit('update:weight', val);
});

watch(opacity, (val) => {
	emit('update:opacity', val);
});

watch(distanceKm, (val) => {
	emit('update:distanceKm', val);
});

</script>

<template>
	<v-card class="pa-4" elevation="2">
		<v-card class="pa-4" elevation="2">
			<h3>Color</h3>
			<v-color-picker
				style="margin: auto;"
				v-model="color"
				mode="rgba"
			>
			</v-color-picker>
		</v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Weight</h3>
			<input :value="10" />
			<v-slider v-model="weight" :min="1" :max="20" step="0.5">
				<template v-slot:append>
					<span>{{ weight }}</span>
				</template>

			</v-slider>
		</v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Opacity</h3>
			<input :value="0.5" />
		</v-card>
		<v-card class="pa-4" elevation="2">
			<h3>Distance (Km)</h3>
			<input :value="1" />
		</v-card>
	</v-card>
</template>

<style scoped></style>
