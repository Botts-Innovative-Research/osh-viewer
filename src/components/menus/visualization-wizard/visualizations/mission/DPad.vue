<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['up', 'down', 'release']);

const activeButton = ref<string | null>(null);

function handleDown(direction: 'up' | 'down') {
  activeButton.value = direction;
  emit(direction);
}

function handleUp() {
  activeButton.value = null;
  emit('release');
}
</script>

<template>
  <div class="dpad-container">
    <button
        class="dpad-btn dpad-up"
        :class="{ active: activeButton === 'up' }"
        @mousedown="handleDown('up')"
        @touchstart.prevent="handleDown('up')"
        @mouseup="handleUp"
        @touchend.prevent="handleUp"
        @mouseleave="handleUp"
    >
      <v-icon>mdi-chevron-up</v-icon>
    </button>

    <button
        class="dpad-btn dpad-down"
        :class="{ active: activeButton === 'down' }"
        @mousedown="handleDown('down')"
        @touchstart.prevent="handleDown('down')"
        @mouseup="handleUp"
        @touchend.prevent="handleUp"
        @mouseleave="handleUp"
    >
      <v-icon>mdi-chevron-down</v-icon>
    </button>
  </div>
</template>

<style scoped>
.dpad-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  user-select: none;
}

.dpad-btn {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s;
  touch-action: none;
}

.dpad-btn:active,
.dpad-btn.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(0.95);
}

.dpad-btn .v-icon {
  font-size: 32px;
}
</style>