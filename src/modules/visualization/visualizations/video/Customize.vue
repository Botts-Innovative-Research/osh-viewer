<script setup lang="ts">
import { computed, ref } from 'vue';
import { useComponentValidation } from '../../../../components/menus/visualization-wizard/shared/helpers';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import VideoOptions from '@/modules/visualization/wizard/customizations/VideoOptions.vue'

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const nameValid = ref<boolean>(false)
const valid = computed(() => {
  return nameValid.value
})
useComponentValidation(valid, emit)
</script>

<template>
  <NameControl role="video" v-model:valid="nameValid" />
  <VideoOptions />
</template>
