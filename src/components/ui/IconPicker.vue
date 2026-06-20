<script setup lang="ts">
import { ICON_OPTIONS, IconItem } from '@/lib/icons';
import { ref, watch } from 'vue';

const model = defineModel<IconItem>({
	required: true,
});
</script>

<template>
	<v-btn-toggle
		v-model="model"
		mandatory
		class="ga-2 h-auto"
	>
		<IconButton
			v-for="icon in ICON_OPTIONS"
			v-model="model"
			:icon="`mdi-${icon.icon}`"
			variant="text"
			size="x-large"
			class="iconButton"
			:value="`/icons/${icon.category}/`"
		></IconButton>
	</v-btn-toggle>
</template>
<style scoped>
.iconButton {
	font-size: 35px;
}
</style>
