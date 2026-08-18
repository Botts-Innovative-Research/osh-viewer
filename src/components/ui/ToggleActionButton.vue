<script setup lang="ts">
import ActionButton from '@/components/ui/ActionButton.vue';

const props = withDefaults(
	defineProps<{
		toggleOn: boolean;
		toolName: string;
	}>(),
	{}
);
</script>
<template>
	<v-tooltip
		location="bottom"
		:text="`${props.toggleOn ? 'Hide' : 'Show'} ${props.toolName}`"
	>
		<template v-slot:activator="{ props: tooltipProps }">
			<ActionButton
				@submit="$emit('submit')"
				:label="props.toolName"
				:icon="`mdi-${props.toggleOn ? 'eye' : 'eye-off'}`"
				variant="plain"
				:color="`${props.toggleOn ? 'primary' : 'grey'}`"
				v-bind="tooltipProps"
			/>
		</template>
	</v-tooltip>
</template>
