<script setup>
import { ref } from 'vue';
import AppSettings from './menus/AppSettings.vue';
import { useConfigPersistence } from '@/composables/useConfigPersistence';
import SaveConfigSettings from "@/components/menus/SaveConfigSettings.vue";

const settingsDialog = ref(false);
const saveDialog = ref(false);
const viewerName = import.meta.env.VITE_VIEWER_NAME;

const { saveConfig, loadConfig } = useConfigPersistence();
</script>

<template>
	<v-toolbar :title="viewerName" color="blue" density="comfortable">
		<v-btn icon="mdi-home" to="/" />
<!--		<v-btn icon="mdi-account" />-->
<!--		<v-btn icon="mdi-menu" />-->
<!--		<v-btn icon="mdi-magnify" />-->
		<v-btn icon @click="saveDialog = true">
      <v-icon>mdi-content-save</v-icon>
      <v-tooltip activator="parent" location="bottom"> Save State </v-tooltip>
    </v-btn>
    <v-dialog v-model="saveDialog" max-width="400">
      <SaveConfigSettings @saved="saveDialog = false" />
    </v-dialog>
    <v-btn icon @click="loadConfig">
      <v-icon>mdi-reload</v-icon>
      <v-tooltip activator="parent" location="bottom"> Load State </v-tooltip>
    </v-btn>
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
