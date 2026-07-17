<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import DeleteButton from '@/components/ui/DeleteButton.vue';

const { selectedMissionControllers, missionVisualizations, openEditViz, removeMission } = defineProps<{
	selectedMissionControllers: OSHVisualization[];
	missionVisualizations: OSHVisualization[];
	openEditViz: (viz: string | OSHVisualization) => void;
	removeMission: (viz: OSHVisualization) => void;
}>();

const emit = defineEmits<{
	(e: 'update:selectedMissionControllers', value: OSHVisualization[]): void;
}>();
</script>
<template>
	<v-select
		label=""
		:model-value="selectedMissionControllers"
		@update:model-value="emit('update:selectedMissionControllers', $event)"
		v-bind:items="missionVisualizations"
		item-title="name"
		return-object
		multiple
		chips
		hide-details
		clearable
	>
		<template v-slot:item="{ item, props: itemProps }">
			<v-list-item v-bind="itemProps">
				<template v-slot:prepend="{ isSelected }">
					<v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
				</template>
				<!-- Actions -->
				<template v-slot:append>
					<v-tooltip
						text="Edit Visualization"
						location="bottom"
					>
						<template v-slot:activator="{ props: tooltipProps }">
							<IconButton
								v-bind="tooltipProps"
								aria-label="Edit Visualization"
								size="x-small"
								variant="plain"
								icon="mdi-pencil"
								@click.stop="openEditViz(item.id!)"
							>
							</IconButton>
						</template>
					</v-tooltip>
					<DeleteButton
						label="Remove"
						@delete="removeMission(item)"
					></DeleteButton>
				</template>
			</v-list-item>
		</template>
	</v-select>
</template>