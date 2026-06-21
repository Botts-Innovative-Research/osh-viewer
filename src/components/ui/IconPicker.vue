<script setup lang="ts">
import { IconItem } from '@/lib/icons';

const props = defineProps<{
	iconOptions: IconItem[];
}>();
const model = defineModel<string>({
	required: true,
});
</script>

<template>
	<v-btn-toggle
		v-model="model"
		mandatory
		class="ga-2 h-auto flex-wrap justify-end"
	>
		<IconButton
			v-for="icon in iconOptions"
			v-model="model"
			:icon="`mdi-${icon.icon}`"
			variant="text"
			size="x-large"
			class="iconButton"
			:value="`/icons/${icon.category}/${icon.icon}.png`"
		></IconButton>
	</v-btn-toggle>
</template>
<style scoped>
.iconButton {
	font-size: 35px;
}
</style>
