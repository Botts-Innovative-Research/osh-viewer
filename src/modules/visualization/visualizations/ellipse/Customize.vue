<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import ColorControl from '../../wizard/customizations/ColorControl.vue';

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
		role="position"
		v-model:valid="nameValid"
	/>
	<ColorControl
		roleName="color"
		lable="Color"
	/>
</template>
