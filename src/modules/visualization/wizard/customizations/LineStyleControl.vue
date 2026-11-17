<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

const props = withDefaults(
	defineProps<{
		roleName: string;
		label?: string;
		defaultValue?: LineStyle;
	}>(),
	{ label: 'Line Style', defaultValue: 'solid' }
);

const vwStore = useVizWizStore();
const lineStyle = ref<LineStyle>(props.defaultValue);

const options: { value: LineStyle; title: string; dash: string }[] = [
	{ value: 'solid', title: 'Solid', dash: '' },
	{ value: 'dashed', title: 'Dashed', dash: '8 5' },
	{ value: 'dotted', title: 'Dotted', dash: '1 5' },
];

watch(lineStyle, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: val });
});

onMounted(() => {
	const existing = vwStore.visualizationCustomizationOptions[props.roleName];
	if (existing) {
		lineStyle.value = existing;
	} else {
		vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: lineStyle.value });
	}
});
</script>

<template>
	<h3>{{ props.label }}</h3>
	<v-btn-toggle v-model="lineStyle" mandatory divided variant="outlined" color="primary" class="mb-4">
		<v-btn v-for="opt in options" :key="opt.value" :value="opt.value">
			<svg width="36" height="10" class="mr-2" aria-hidden="true">
				<line x1="2" y1="5" x2="34" y2="5" stroke="currentColor" stroke-width="3"
					stroke-linecap="round" :stroke-dasharray="opt.dash" />
			</svg>
			{{ opt.title }}
		</v-btn>
	</v-btn-toggle>
</template>