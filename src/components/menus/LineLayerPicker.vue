<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue';
	import { useVisualizationStore } from '@/stores/visualizationstore';

	const props = defineProps<{ title: string }>();
	const emit = defineEmits<{
		(
			e: 'update:lobLineProperties',
			value: { color: string; opacity: number; weight: number; length: number }
		): void;
	}>();
	const visualizationStore = useVisualizationStore();
	const lobRadius = ref(2);

	// hold raw rgba string from <v-color-picker>
	const selectedRgbaColor = ref<{ r: number; g: number; b: number; a: number }>({
		r: 50,
		g: 68,
		b: 158,
		a: 0.5,
	});
	const lineWeight = ref(10);

	const lineProperties = computed(() => {
		const color = `rgb(${selectedRgbaColor.value.r}, ${selectedRgbaColor.value.g}, ${selectedRgbaColor.value.b})`;
		const opacity = selectedRgbaColor.value.a;
		const weight = lineWeight.value;
		const length = lobRadius.value;
		return { color, opacity, weight, length };
	});

	watch(
		lineProperties,
		(val) => {
			emit('update:lobLineProperties', val);
		},
		{ deep: true }
	);

	onMounted(() => {
		emit('update:lobLineProperties', lineProperties.value);
	});
</script>

<template>
	<v-card class="pa-2">
		<h3>{{ props.title }}</h3>
		<v-container>
			<v-color-picker style="margin: auto" v-model="selectedRgbaColor" mode="rgba">
			</v-color-picker>
			<!-- <v-card style="max-width: 300px; margin-top: 10px;"> -->
			<v-slider
				style="margin-top: 30px; margin-right: 20px"
				v-model="lineWeight"
				:max="20"
				:min="5"
				:step="1"
				thumb-label
				:thumb-size="15"
				label="Line Weight">
			</v-slider>
			<v-text-field
				v-model="lobRadius"
				label="LOB Radius (km)"
				placeholder="2"
				hint="Enter the desired length of the LOB radius in kilometers">
			</v-text-field>
			<!-- </v-card> -->
		</v-container>
	</v-card>
</template>

<style scoped></style>
