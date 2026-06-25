<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	content: string; // Text content to display in tooltip
}>();

const show = ref(false); // Whether the tooltip is toggled on/off
</script>
<template>
	<v-tooltip
		v-model="show"
		location="end"
		:open-on-hover="false"
		open-on-click
	>
		<template v-slot:activator="{ props }">
			<IconButton
				v-bind="props"
				icon="mdi-information-outline"
				size="sm"
				variant="plain"
			></IconButton>
		</template>
		<span>{{ props.content }}</span>
	</v-tooltip>
</template>
