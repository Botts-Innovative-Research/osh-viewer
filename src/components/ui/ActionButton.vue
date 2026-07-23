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
    }>(),
    {
      label: 'Send',
      icon: 'mdi-send',
      disabled: false
    }
);

const emit = defineEmits<{
	(e: 'submit'): void;
}>();

</script>

<template>
  <v-btn
      block
      color="primary"
      variant="tonal"
      @click="emit('submit')"
      :prepend-icon="props.icon"
      :disabled="props.disabled"
  >
    {{ props.label }}
  </v-btn>
</template>

<style scoped>
</style>
