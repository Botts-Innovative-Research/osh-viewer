<script setup lang="ts">
/**
 * Delete icon button
 * Emits delete onclick
 */

const props = defineProps<{
  label: string
}>()

const emit = defineEmits<{
  (e: 'delete'): void
}>()

</script>

<template>
  <IconButton v-bind="$attrs" :aria-label="props.label" class="close-btn" icon="mdi-window-close" size="x-small" variant="plain"
    @click.stop="emit('delete')"></IconButton>
</template>

<style scoped>
/* Color styling for delete button */
.close-btn {
	transition: color 0.2s ease-in-out;
}

.close-btn:hover {
	color: red;
}

.close-btn:active {
	color: red;
}
</style>