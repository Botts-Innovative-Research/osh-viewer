<script setup>
import { ref } from 'vue';
import Settings from '@/modules/settings/Settings.vue';
import SaveStateSettings from '@/components/menus/SaveStateSettings.vue';
import LoadStateSettings from '@/components/menus/LoadStateSettings.vue';
import NodeIcon from '@/components/icons/node-logo.svg';

const settingsDialog = ref(false);
const saveDialog = ref(false);
const loadDialog = ref(false);
const viewerName = import.meta.env.VITE_VIEWER_NAME;
</script>

<template>
	<v-toolbar
		color="primary"
		density="comfortable"
		class="pl-4 pr-2"
	>
		<template #prepend>
			<v-icon :icon="NodeIcon"></v-icon>
		</template>
		<template #title>
			<span class="pl-2">{{ viewerName }}</span>
		</template>
		<v-btn
			icon
			to="/"
			class="router-link"
		>
			<v-icon>mdi-home</v-icon>
		</v-btn>
		<v-btn
			icon
			to="/about"
			class="router-link"
		>
			<v-icon>mdi-help</v-icon>
		</v-btn>

		<v-btn
			icon
			@click="saveDialog = true"
		>
			<v-icon>mdi-content-save</v-icon>
			<v-tooltip
				activator="parent"
				location="bottom"
			>
				Save State
			</v-tooltip>
		</v-btn>
		<v-dialog
			v-model="saveDialog"
			max-width="500"
		>
			<SaveStateSettings @saved="saveDialog = false" />
		</v-dialog>

		<v-btn
			icon
			@click="loadDialog = true"
		>
			<v-icon>mdi-reload</v-icon>
			<v-tooltip
				activator="parent"
				location="bottom"
			>
				Load State
			</v-tooltip>
		</v-btn>
		<v-dialog
			v-model="loadDialog"
			max-width="500"
		>
			<LoadStateSettings @load="loadDialog = false" />
		</v-dialog>

		<v-btn
			icon
			@click="settingsDialog = true"
		>
			<v-icon>mdi-cog</v-icon>
			<v-tooltip
				activator="parent"
				location="bottom"
			>
				Settings
			</v-tooltip>
		</v-btn>
		<v-dialog
			v-model="settingsDialog"
			max-width="800"
		>
			<Settings />
		</v-dialog>
	</v-toolbar>
</template>

<style scoped>
.router-link {
	color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
