<script setup lang="ts">
/**
 * Send button
 * Emits send onclick
 */

const emit = defineEmits<{
	(e: 'send'): void;
}>();
</script>

<template>
    <v-btn
        block
        class="send-btn"
        color="primary"
        variant="tonal"
        @click="emit('send')"
    >
      <v-icon start>mdi-send</v-icon>
      Send
    </v-btn>
</template>

<style scoped>
.send-btn {
  transition: all 0.2s ease;
}

.send-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
