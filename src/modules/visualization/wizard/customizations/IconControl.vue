<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import RadioCards from '@/components/ui/RadioCards.vue';

const vwStore = useVizWizStore();
type IconItem = {
	id: number;
	label: string;
	icon: string;
};
// icon value corresponds to mdi icon names AND svg filenames in /icons/map/
const iconOptions: IconItem[] = [
	{ id: 1, label: 'Marker', icon: 'map-marker' },
	{ id: 2, label: 'Pin', icon: 'pin' },
	{ id: 3, label: 'Arrow', icon: 'arrow-up-bold' },
	{ id: 4, label: 'Antenna', icon: 'antenna' },
	{ id: 5, label: 'Camera', icon: 'camera-marker' },
	{ id: 6, label: 'Cellphone', icon: 'cellphone-marker' },
	{ id: 7, label: 'Eye', icon: 'eye' },
	{ id: 8, label: 'Drone', icon: 'quadcopter' },
];
const iconBase =
	import.meta.env.VITE_VIEWER_ENDPOINT !== undefined ? import.meta.env.VITE_VIEWER_ENDPOINT : '';
const icon = ref(iconOptions[0]);

function selectIcon(val: any) {
	icon.value = val;
	vwStore.updateVisualizationCustomizationOptions({
		icon: `${iconBase}/icons/map/${val.icon}.svg`,
		iconName: val.icon,
	});
}

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.icon) {
		vwStore.updateVisualizationCustomizationOptions({
			icon: `/icons/map/${icon.value.icon}.svg`,
			iconName: icon.value.icon,
		});
	} else {
		const savedIconName = vwStore.visualizationCustomizationOptions.iconName;
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
	></radio-cards>
</template>
