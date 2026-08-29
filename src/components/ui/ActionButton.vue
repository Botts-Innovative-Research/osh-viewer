<script setup lang="ts">
/**
 * Action button
 * Emits submit onclick
 */
const props = withDefaults(
	defineProps<{
		label?: string;
		icon?: string;
		disabled?: boolean;
		color?: string;
		variant?: 'tonal' | 'flat' | 'text' | 'elevated' | 'outlined' | 'plain';
		block?: boolean;
	}>(),
	{
		label: 'Send',
		icon: 'mdi-send',
		disabled: false,
		color: 'primary',
		variant: 'tonal',
		block: true,
	}
);

const emit = defineEmits<{
	(e: 'submit'): void;
}>();
</script>

<template>
	<v-btn
		:block="props.block"
		:color="props.color"
		:variant="props.variant"
		@click="emit('submit')"
		:prepend-icon="props.icon"
		:disabled="props.disabled"
	>
		{{ props.label }}
	</v-btn>
</template>

<style scoped></style>
