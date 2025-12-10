<script setup lang="ts">
import IconPicker from '@/components/menus/IconPicker.vue';
import LoBCustomizationOptions from '@/components/menus/visualization-wizard/visualizations/lob/LoBCustomizationOptions.vue';

const props = defineProps<{
	title: string;
	someText?: string;
	optionType?: string;
}>();

const emit = defineEmits(['update:selectedVisualizationOptions']);

function handleOptionsUpdate(options: any) {
	emit('update:selectedVisualizationOptions', options);
}
</script>

<template>
	<div>
		<h2>{{ title }}</h2>
		<p v-if="someText">{{ someText }}</p>
		<div v-if="optionType === 'pointmarker'">
			<IconPicker />
		</div>
		<div v-else-if="optionType === 'lob'">
			<LoBCustomizationOptions
				v-on:update:selectedVisualizationOptions="(val: any) => handleOptionsUpdate(val)"
			/>
		</div>
	</div>
</template>

<style scoped></style>
