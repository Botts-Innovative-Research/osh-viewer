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

const isPressed = ref(false);
const fillComplete = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const fillDurationCss = computed(() => `${props.duration}ms`);

function startPress() {
	if (isPressed.value) return;
	isPressed.value = true;
	fillComplete.value = false;

	timer = setTimeout(() => {
		fillComplete.value = true;
		emit('confirm');
		endPress();
	}, props.duration);
}

function endPress() {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
	isPressed.value = false;
	fillComplete.value = false;
}

function preventContextMenu(e: Event) {
	e.preventDefault();
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
		@contextmenu="preventContextMenu"
	>
		<div class="progress-btn" :class="{ filling: isPressed }" />
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
.progress-btn {
  position: absolute;
  inset: 0;
  width: 0;
  background: rgba(255, 255, 255, 0.2);
  z-index: 0;
  pointer-events: none;
  border-radius: 8px;
}

.progress-btn.filling {
  width: 100%;
  transition: width v-bind(fillDurationCss) linear;
}
</style>
