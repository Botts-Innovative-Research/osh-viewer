<script setup lang="ts">
import { ref } from 'vue';
import LoBOptions from '@/components/menus/visualization-wizard/visualizations/lob/LoBOptions.vue';

const vizOptions = ref<any | null>();

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

function setStartTime(time: string) {
	vizOptions.value = {
		...vizOptions.value,
		startTime: time,
	};
}

function setEndTime(time: string) {
	vizOptions.value = {
		...vizOptions.value,
		endTime: time,
	};
}

function setPlaybackMode(mode: string) {
	vizOptions.value = {
		...vizOptions.value,
		playbackMode: mode,
	};
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
	</div>
</template>

<style scoped></style>
