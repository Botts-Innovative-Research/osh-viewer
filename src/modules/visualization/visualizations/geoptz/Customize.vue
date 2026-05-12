<script setup lang="ts">
import { ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import { computed } from 'vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const valid = computed(() => {
	return nameValid.value;
});
useComponentValidation(valid, emit);
</script>

<template>
	<NameControl
		default-name="New GeoPTZ"
		v-model:valid="nameValid"
	></NameControl>
</template>
