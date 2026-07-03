<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsstore';
import { computed } from 'vue';

const settingsStore = useSettingsStore();

const theme = computed({
	get: () => settingsStore.theme,
	set: (val) => settingsStore.setTheme(val),
});
</script>

<template>
	<v-card style="padding: 0px">
		<v-card-item>
			<v-card-title>General</v-card-title>
			<v-card-subtitle>Configure general application settings.</v-card-subtitle>
		</v-card-item>
		<v-card-text class="pa-0">
			<v-list>
				<v-list-item>
					<v-list-item-title>Theme</v-list-item-title>
					<template #append>
						<v-btn-toggle
							v-model="theme"
							mandatory
							class="ga-2"
						>
							<v-btn value="light">
								<v-icon>mdi-white-balance-sunny</v-icon>
								Light
							</v-btn>
							<v-btn value="dark">
								<v-icon>mdi-weather-night</v-icon>
								Dark
							</v-btn>
						</v-btn-toggle>
					</template>
				</v-list-item>
			</v-list>
		</v-card-text>
	</v-card>
</template>
