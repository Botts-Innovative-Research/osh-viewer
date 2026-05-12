<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import IconColorControl from '@/modules/visualization/wizard/customizations/IconColorControl.vue';
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
	<icon-control></icon-control>
	<IconColorControl></IconColorControl>
</template>
