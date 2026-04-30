<script setup>
import { ref } from 'vue';
import Settings from '@/components/menus/settings/Settings.vue';
import SaveStateSettings from "@/components/menus/SaveStateSettings.vue";
import LoadStateSettings from "@/components/menus/LoadStateSettings.vue";

const settingsDialog = ref(false);
const saveDialog = ref(false);
const loadDialog = ref(false);
const viewerName = import.meta.env.VITE_VIEWER_NAME;
</script>

<template>
	<v-toolbar :title="viewerName" color="blue" density="comfortable">
		<v-btn icon="mdi-home" to="/" />
    <v-btn icon="mdi-help" to="/about" />
 
		<v-btn icon @click="saveDialog = true">
      <v-icon>mdi-content-save</v-icon>
      <v-tooltip activator="parent" location="bottom"> Save State </v-tooltip>
    </v-btn>
    <v-dialog v-model="saveDialog" max-width="500">
      <SaveStateSettings @saved="saveDialog = false" />
    </v-dialog>

    <v-btn icon @click="loadDialog = true">
      <v-icon>mdi-reload</v-icon>
      <v-tooltip activator="parent" location="bottom"> Load State </v-tooltip>
    </v-btn>
    <v-dialog v-model="loadDialog" max-width="500">
      <LoadStateSettings @load="loadDialog = false" />
    </v-dialog>
    
		<v-btn icon @click="settingsDialog = true">
			<v-icon>mdi-cog</v-icon>
			<v-tooltip activator="parent" location="bottom"> Settings </v-tooltip>
		</v-btn>
		<v-dialog v-model="settingsDialog" max-width="800">
			<Settings />
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
