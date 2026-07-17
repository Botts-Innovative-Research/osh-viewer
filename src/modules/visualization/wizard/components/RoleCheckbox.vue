<script setup lang="ts">
import InfoTooltip from '@/components/ui/InfoTooltip.vue';
import { ComputedRef } from 'vue';

const props = defineProps<{
	label: string; // Label for checkbox
	tooltip: string; // Text content for info tooltip
	disabled?: boolean; // Checkbox disabled status
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
	<v-row class="mt-2">
		<v-col>
			<v-expand-transition>
				<div v-if="model">
					<slot></slot>
				</div>
			</v-expand-transition>
		</v-col>
	</v-row>
</template>
<style scoped>
.tooltip-padding {
	padding: 0;
	padding-bottom: 2px;
}
</style>
