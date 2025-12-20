<script setup lang="ts">

import {Mode} from 'osh-js/source/core/datasource/Mode.js';
import { watch } from 'vue';

const playbackModes = Object.entries(Mode).map(([key, value]) => ({
	label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
	value,
}));
const selectedPlaybackMode = defineModel('modelValue');

watch(selectedPlaybackMode, (val) => {
	console.log('playback mode changed to:', val);
});

</script>

<template>
	<v-combobox
		v-model="selectedPlaybackMode"
		:items="playbackModes"
		item-title="label"
		item-value="value"
		label="Playback Mode"
		variant="solo"
		density="compact"
	/>
</template>

<style scoped></style>
