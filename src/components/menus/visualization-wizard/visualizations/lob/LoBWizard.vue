<script setup lang="ts">
import { ref } from 'vue';
import LoBOptions from '@/components/menus/visualization-wizard/visualizations/lob/LoBOptions.vue';

const props = defineProps<{
	// step: number;
}>();
const vizOptions = ref<any | null>();

function setColor(color: string) {
	vizOptions.value = {
		...vizOptions.value,
		color: color,
	};
}

function setWeight(weight: number) {
	vizOptions.value = {
		...vizOptions.value,
		weight: weight,
	};
}

function setDistanceKm(distanceKm: number) {
	vizOptions.value = {
		...vizOptions.value,
		distanceKm: distanceKm,
	};
}

function setOriginProperty(property: string) {
	vizOptions.value = {
		...vizOptions.value,
		originProperty: property,
	};
}

function setHeadingProperty(property: string) {
	vizOptions.value = {
		...vizOptions.value,
		headingProperty: property,
	};
}

function createLobVizOptions() {
	// Logic to create and save the Line of Bearing visualization options
	console.log('Creating LoB Visualization Options:', vizOptions.value);
}
</script>

<template>
	<div>
		<div>
			<h2>Line of Bearing Options</h2>
			<p>Configure the visualization options for the Line of Bearing.</p>
			<LoBOptions
				v-on:update:selectedOriginProperty="setOriginProperty"
				v-on:update:selectedHeadingProperty="setHeadingProperty"
			/>
		</div>
		<!--		<div>-->
		<!--			<LoBCustomizationOptions v-on:update:color="setColor"-->
		<!--			v-on:update:weight="setWeight"-->
		<!--			v-on:update:distanceKm="setDistanceKm"-->
		<!--			/>-->
		<!--		</div>-->
	</div>
</template>

<style scoped></style>
