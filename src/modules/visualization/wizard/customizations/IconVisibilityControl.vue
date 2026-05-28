<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = withDefaults(
	defineProps<{
		roleName: string; // Name to store in the vizwizstore, default is 'icon'
		label: string; // Label for the checkbox, default is 'Show Icon'
	}>(),
	{
		roleName: 'showIcon',
		label: 'Show Icon',
	}
);

const vwStore = useVizWizStore();
const show = ref<boolean>(true);

watch(show, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: val });
});

onMounted(() => {
	if (vwStore.visualizationCustomizationOptions[props.roleName] === undefined) {
		vwStore.updateVisualizationCustomizationOptions({
			[props.roleName]: show.value,
		});
	} else {
		show.value = vwStore.visualizationCustomizationOptions[props.roleName];
	}
});
</script>

<template>
	<v-checkbox
		v-model="show"
		:label="props.label"
	/>
</template>
