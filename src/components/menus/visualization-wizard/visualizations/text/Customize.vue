<script setup lang="ts">
import { computed, ref } from 'vue';
import { useComponentValidation } from '../../shared/helpers';
import { VisualizationComponentEmits } from '../../VisualizationRegistry';
import NameControl from '../../viz-components/customizations/NameControl.vue';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const nameValid = ref<boolean>(false)
const valid = computed(() => {
  return nameValid.value
})
useComponentValidation(valid, emit)
</script>

<template>
  <NameControl role="stream" v-model:valid="nameValid" />
</template>