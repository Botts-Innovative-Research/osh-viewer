<script setup lang="ts">
	import { useUIStore } from '@/stores/uistore';
	import { storeToRefs } from 'pinia';

	const uiStore = useUIStore();
	const { theme } = storeToRefs(uiStore);

	function setTheme(newTheme: 'dark' | 'light') {
		theme.value = newTheme;
	}
</script>

<template>
	<v-list>
		<v-list-item>
			<v-list-item-title>Theme</v-list-item-title>
			<v-btn-toggle v-model="theme" mandatory>
				<v-btn value="light" @click="setTheme('light')">
					<v-icon>mdi-white-balance-sunny</v-icon>
					Light
				</v-btn>
				<v-btn value="dark" @click="setTheme('dark')">
					<v-icon>mdi-weather-night</v-icon>
					Dark
				</v-btn>
			</v-btn-toggle>
		</v-list-item>
	</v-list>
</template>

<style scoped>
	.v-btn-toggle {
		margin-top: 8px;
	}
</style>
