<script setup lang="ts">
const color = defineModel<string>({
	required: true,
});
</script>

<template>
	<v-menu
		location="start"
		:close-on-content-click="false"
	>
		<template #activator="{ props }">
			<v-card
				v-bind="props"
				width="24"
				height="24"
				rounded="circle"
				:color="color"
				class="cursor-pointer border-sm"
				elevation="2"
				:ripple="false"
			/>
		</template>
		<v-color-picker
			v-model="color"
			mode="rgba"
			hide-inputs
		/>
	</v-menu>
</template>
