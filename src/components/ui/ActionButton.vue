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
    }>(),
    {
      label: 'Send',
      icon: 'mdi-send',
      disabled: false,
      color: 'primary'
    }
);

const emit = defineEmits<{
	(e: 'submit'): void;
}>();

</script>

<template>
  <v-btn
      block
      :color="props.color"
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
