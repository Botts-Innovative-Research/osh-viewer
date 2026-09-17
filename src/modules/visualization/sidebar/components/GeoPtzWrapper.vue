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
		hint="Select a controller to send GeoPTZ tasks"
		persistent-hint
		label="GeoPTZ Controllers"
		:model-value="selectedGeoPTZControllers"
		@update:model-value="emit('update:selectedGeoPTZControllers', $event)"
		v-bind:items="geoPtzVisualizations"
		item-title="name"
		:item-value="(item: OSHVisualization) => item"
		chips
		multiple
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
						@delete="removeGeoPTZ(item)"
					></DeleteButton>
				</template>
			</v-list-item>
		</template>
	</v-select>
</template>
