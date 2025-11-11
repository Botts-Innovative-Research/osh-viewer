<script setup>
	import { ref } from 'vue';
	import AppSettings from './menus/AppSettings.vue';

	const settingsDialog = ref(false);
</script>

<template>
	<v-toolbar title="OSH Viewer" color="blue" density="comfortable">
		<v-btn icon="mdi-home" to="/" />
		<v-btn icon="mdi-account" />
		<v-btn icon="mdi-menu" />
		<v-btn icon="mdi-magnify" />
		<v-btn icon @click="settingsDialog = true">
			<v-icon>mdi-cog</v-icon>
			<v-tooltip activator="parent" location="bottom"> Settings </v-tooltip>
		</v-btn>
		<v-dialog v-model="settingsDialog" max-width="400">
			<AppSettings />
		</v-dialog>
	</v-toolbar>
</template>

<style scoped>
	/*header {
  width: 100vw;
  display: flex;
  justify-content: space-evenly;
  align-items: start;
  padding: 0.5rem;
  background-color: var(--color-background-soft);
}*/
</style>
