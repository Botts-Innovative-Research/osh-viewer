<template>
	<v-card class="pa-4 wizard-step-card" elevation="4">
		<v-card-title v-if="title" class="text-h4 text-center">{{ title }}</v-card-title>
		<slot name="header"></slot>
		<div v-if="$slots.default">
			<slot></slot>
		</div>
		<slot name="footer"></slot>
	</v-card>
</template>

<script setup lang="ts">
	defineProps<{ title?: string }>();
</script>

<style scoped>
	.wizard-step-card {
		width: 75vw;
		max-width: 900px;
		min-width: 320px;
		margin: 32px 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	}
</style>
