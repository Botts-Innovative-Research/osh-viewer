<script setup lang="ts">
import InfoTooltip from '@/components/ui/InfoTooltip.vue';

const props = defineProps<{
	label: string; // Label for checkbox
	disabled?: boolean; // Checkbox disabled status
	tooltip: string; // Text content for info tooltip
}>();
const model = defineModel<boolean>();
</script>
<template>
	<v-row class="align-center h-auto">
		<v-col cols="auto">
			<v-checkbox
				v-model="model"
				:label="props.label"
				:disabled="props.disabled ?? false"
				hide-details
			/>
		</v-col>
		<v-col
			cols="auto"
			class="tooltip-padding"
		>
			<info-tooltip :content="tooltip" />
		</v-col>
	</v-row>
</template>
<style scoped>
.tooltip-padding {
	padding: 0;
	padding-bottom: 2px;
}
</style>
