<script setup lang="ts">
import { ref } from 'vue';
import { VisualizationComponentEmits } from '../../VisualizationRegistry';
import NameControl from '../../viz-components/customizations/NameControl.vue';
import { computed } from 'vue';
import { useComponentValidation } from '../../shared/helpers';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const nameValid = ref<boolean>(false)
const valid = computed(() => {
  return nameValid.value
})
useComponentValidation(valid, emit)
</script>

<template>
  <NameControl default-name="New Mission Builder" v-model:valid="nameValid"></NameControl>
</template>
