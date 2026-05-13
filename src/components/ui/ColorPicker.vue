<script setup lang="ts">
import { ref, watch } from 'vue';

const model = defineModel<string>({
	required: true,
});
const tempColor = ref(model.value);

watch(model, (val: string) => {
	tempColor.value = val;
});

function commitColor() {
	model.value = tempColor.value;
}
</script>

<template>
	<v-menu
		location="start"
		:close-on-content-click="false"
		@update:model-value="(open) => !open && commitColor()"
	>
		<template #activator="{ props }">
			<v-card
				v-bind="props"
				width="24"
				height="24"
				rounded="circle"
				:color="model"
				class="cursor-pointer border-sm"
				elevation="2"
				:ripple="false"
			/>
		</template>
		<v-color-picker
			v-model="tempColor"
			mode="rgba"
			hide-inputs
		/>
	</v-menu>
</template>
