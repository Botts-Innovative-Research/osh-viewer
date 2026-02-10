<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 150
  },
  maxDistance: {
    type: Number,
    default: 50
  }
});

const emit = defineEmits(['move', 'stop']);

const joystickContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const stickPosition = ref({ x: 0, y: 0 });
const startPos = ref({ x: 0, y: 0 });

const stickStyle = computed(() => ({
  transform: `translate(${stickPosition.value.x}px, ${stickPosition.value.y}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.2s'
}));

function handleStart(e: TouchEvent | MouseEvent) {
  isDragging.value = true;

  const rect = joystickContainer.value?.getBoundingClientRect();
  if (!rect) return;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  startPos.value = { x: centerX, y: centerY };
}

function handleMove(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return;

  e.preventDefault();

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

  let dx = clientX - startPos.value.x;
  let dy = clientY - startPos.value.y;

  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > props.maxDistance) {
    const angle = Math.atan2(dy, dx);
    dx = Math.cos(angle) * props.maxDistance;
    dy = Math.sin(angle) * props.maxDistance;
  }

  stickPosition.value = { x: dx, y: dy };

  // normalize to -1 to 1
  const normalX = dx / props.maxDistance;
  const normalY = dy / props.maxDistance;

  emit('move', {
    x: normalX,
    y: normalY,
    magnitude: Math.min(dist / props.maxDistance, 1)
  });
}

function handleStop() {
  isDragging.value = false;
  stickPosition.value = { x: 0, y: 0 };
  emit('stop');
}

onMounted(() => {
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleStop);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleStop);
});

onUnmounted(() => {
  document.removeEventListener('touchmove', handleMove);
  document.removeEventListener('touchend', handleStop);
  document.removeEventListener('mousemove', handleMove);
  document.removeEventListener('mouseup', handleStop);
});
</script>

<template>
  <div
      ref="joystickContainer"
      class="joystick-container"
      :style="{ width: size + 'px', height: size + 'px' }"
      @touchstart="handleStart"
      @mousedown="handleStart"
  >
    <div class="joystick-base"></div>
    <div
        class="joystick-stick"
        :style="stickStyle"
    ></div>
  </div>
</template>

<style scoped>
.joystick-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
}

.joystick-base {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.joystick-stick {
  position: absolute;
  width: 40%;
  height: 40%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(255, 255, 255, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.joystick-stick:active {
  background: rgba(255, 255, 255, 1);
}
</style>