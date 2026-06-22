<script lang="ts" setup>
import ColorPicker from '@/components/ui/ColorPicker.vue';
import IconPicker from '@/components/ui/IconPicker.vue';
import { ICON_OPTIONS } from '@/lib/icons';
import { OSHSystem } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed } from 'vue';

const props = defineProps<{
	system: OSHSystem;
}>();

const visualizationStore = useVisualizationStore();
const systemId = props.system.id;

const foiIcon = computed({
	get: () =>
		visualizationStore.foiLayers.find((foi) => foi.geometry.systemId === props.system.id)
			?.icon ?? '',
	set: (val: string) => visualizationStore.editFOIIcon(systemId, val),
});
const foiColor = computed({
	get: () =>
		visualizationStore.foiLayers.find((foi) => foi.geometry.systemId === props.system.id)
			?.color ?? '',
	set: (val: string) => visualizationStore.editFOIColor(systemId, val),
});
</script>

<template>
	<v-card class="pa-2">
		<v-card-title>Customize FOI</v-card-title>
		<v-card-text>
			<v-alert
				:text="props.system.name"
				class="mb-4"
			></v-alert>
			<v-list>
				<v-list-item>
					<v-list-item-title>Icon</v-list-item-title>
					<template #append>
						<IconPicker
							v-model="foiIcon"
							:icon-options="
								ICON_OPTIONS.filter(
									(option) =>
										option.category === 'map' || option.category === 'foi'
								)
							"
						></IconPicker>
					</template>
				</v-list-item>
				<v-list-item>
					<v-list-item-title>Icon Color</v-list-item-title>
					<template #append>
						<ColorPicker v-model="foiColor"></ColorPicker>
					</template>
				</v-list-item>
			</v-list>
		</v-card-text>
	</v-card>
</template>

<style scoped></style>
