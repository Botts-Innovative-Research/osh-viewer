<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(
	defineProps<{
		color?: string;
		icon: string;
		label: string;
		tooltip?: string;
		duration?: number;
	}>(),
	{
		color: 'primary',
		duration: 800,
	}
);

const emit = defineEmits<{
	(e: 'confirm'): void;
}>();

let timer: ReturnType<typeof setTimeout> | null = null;

function startPress() {
	timer = setTimeout(() => {
		emit('confirm');
	}, props.duration);
}

function endPress() {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
}
</script>

<template>
	<v-btn
		:color="color"
		block
		variant="tonal"
		@pointerdown.prevent="startPress"
		@pointerup="endPress"
		@pointerleave="endPress"
		@pointercancel="endPress"
	>
    <v-icon start>{{ icon }}</v-icon>
    {{ label }}

		<v-tooltip activator="parent" location="top">
			<span>{{ tooltip }}</span>
			<br />
			<span class="text-caption">Hold to confirm</span>
		</v-tooltip>
	</v-btn>
</template>

<style scoped>
</style>
