<script setup lang="ts">
import { ref } from 'vue';

// Assume icons are in public/icons/map/
const iconNames = [
	'map-marker.svg',
	// Add more icon filenames here as needed
];

const selectedIcon = ref<string | null>(null);

function selectIcon(icon: string) {
	selectedIcon.value = icon;
}
</script>

<template>
	<div>
		<h3>Pick an Icon</h3>
		<div style="display: flex; gap: 10px; flex-wrap: wrap">
			<div
				v-for="icon in iconNames"
				:key="icon"
				@click="selectIcon(icon)"
				style="cursor: pointer; border: 1px solid #ccc; padding: 5px; border-radius: 4px"
			>
				<img :src="`/icons/map/${icon}`" :alt="icon" width="32" height="32" />
			</div>
		</div>
		<div v-if="selectedIcon" style="margin-top: 20px">
			<h4>Selected Icon:</h4>
			<img :src="`/icons/map/${selectedIcon}`" :alt="selectedIcon" width="64" height="64" />
			<div>{{ selectedIcon }}</div>
		</div>
	</div>
</template>

<style scoped></style>
