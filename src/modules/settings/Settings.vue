<script setup lang="ts">
import { ref } from 'vue';
import MapSettings from './MapSettings.vue';
import GeneralSettings from './GeneralSettings.vue';

// Nav drawer state
const selectedTab = ref(['general']);
// @ts-ignore
const appVersion = APP_VERSION;
</script>

<template>
	<v-card>
		<v-card-item>
			<v-card-title>Settings</v-card-title>
			<v-card-subtitle>Version: {{ appVersion }}</v-card-subtitle>
		</v-card-item>
		<v-card-text>
			<v-row>
				<v-col cols="3">
					<v-navigation-drawer
						permanent
						style="position: relative"
					>
						<v-list
							nav
							v-model:selected="selectedTab"
							mandatory
						>
							<v-list-item
								prepend-avatar="mdi-cog"
								value="general"
							>
								<template #prepend><v-icon icon="mdi-cog" /></template>
								<v-list-item-title>General</v-list-item-title>
							</v-list-item>
							<v-list-item
								prepend-avatar="mdi-map"
								value="map"
							>
								<template #prepend><v-icon icon="mdi-map" /></template>
								<v-list-item-title>Map</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-navigation-drawer>
				</v-col>
				<v-col cols="9">
					<v-window v-model="selectedTab">
						<v-window-item value="general">
							<GeneralSettings />
						</v-window-item>
						<v-window-item value="map">
							<MapSettings />
						</v-window-item>
					</v-window>
				</v-col>
			</v-row>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.v-btn-toggle {
	margin-top: 8px;
}
</style>
