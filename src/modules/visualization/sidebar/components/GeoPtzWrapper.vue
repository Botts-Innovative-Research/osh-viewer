<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import DeleteButton from '@/components/ui/DeleteButton.vue';

const { selectedGeoPTZControllers, geoPtzVisualizations, openEditViz, removeGeoPTZ } = defineProps<{
	selectedGeoPTZControllers: OSHVisualization[];
	geoPtzVisualizations: OSHVisualization[];
	openEditViz: (viz: string | OSHVisualization) => void;
	removeGeoPTZ: (viz: OSHVisualization) => void;
}>();

const emit = defineEmits<{
	(e: 'update:selectedGeoPTZControllers', value: OSHVisualization[]): void;
}>();
</script>
<template>
	<v-select
		label="Process"
		:model-value="selectedGeoPTZControllers"
		@update:model-value="emit('update:selectedGeoPTZControllers', $event)"
		v-bind:items="geoPtzVisualizations"
		item-title="name"
		:item-value="(item: OSHVisualization) => item"
		chips
		multiple
		hide-details
		clearable
	>
		<template v-slot:item="{ props, item }">
			<v-list-item v-bind="props">
				<template v-slot:prepend="{ isSelected }">
					<v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
				</template>
				<!-- Actions -->
				<template v-slot:append>
					<v-tooltip
						text="Edit Visualization"
						location="bottom"
					>
						<template v-slot:activator="{ props }">
							<IconButton
								v-bind="props"
								aria-label="Edit Visualization"
								size="x-small"
								variant="plain"
								icon="mdi-pencil"
								@click.stop="openEditViz(item.raw.id!)"
							>
							</IconButton>
						</template>
					</v-tooltip>
					<DeleteButton
						label="Remove"
						@delete="removeGeoPTZ(item.raw)"
					></DeleteButton>
				</template>
			</v-list-item>
		</template>
	</v-select>
</template>
