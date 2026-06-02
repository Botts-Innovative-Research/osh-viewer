<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
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
		role="location"
		v-model:valid="nameValid"
	/>
	<icon-control roleName="icon"></icon-control>
	<color-control
		roleName="iconColor"
		label="Icon Color"
	></color-control>
</template>
