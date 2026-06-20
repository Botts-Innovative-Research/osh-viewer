<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import RadioCards from '@/components/ui/RadioCards.vue';
import { ICON_BASE, ICON_OPTIONS, IconItem } from '@/lib/icons';

const props = withDefaults(
	defineProps<{
		roleName: string; // Name to store in the vizwizstore, default is 'icon'
	}>(),
	{
		roleName: 'icon',
	}
);

const vwStore = useVizWizStore();

const iconOptions = ICON_OPTIONS.filter((option: IconItem) => option.category.includes('map'));
const icon = ref(iconOptions[0]);

function selectIcon(val: any) {
	icon.value = val;
	vwStore.updateVisualizationCustomizationOptions({
		[props.roleName]: `/icons/${val.category}/${val.icon}.png`,
		[`${props.roleName}Name`]: val.icon,
	});
}

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions[props.roleName]) {
		vwStore.updateVisualizationCustomizationOptions({
			[props.roleName]: `/icons/${icon.value.category}/${icon.value.icon}.png`,
			[`${props.roleName}Name`]: icon.value.icon,
		});
	} else {
		const savedIconName = vwStore.visualizationCustomizationOptions[`${props.roleName}Name`];
		const matchedIcon = iconOptions.find((option) => option.icon === savedIconName);
		if (matchedIcon) {
			icon.value = matchedIcon;
		}
	}
});
</script>
<template>
	<h3>Icon</h3>
	<radio-cards
		:items="iconOptions"
		:selected-item="icon"
		:tooltip="false"
		@update:value="selectIcon"
		size="small"
	></radio-cards>
</template>
