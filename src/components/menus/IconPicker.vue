<script setup lang="ts">
	import { ref, watch, onMounted } from 'vue';

	const emit = defineEmits<{
		(e: 'update:iconProperties', icon: string): void;
	}>();

	const availableIcons = [
		{
			name: 'map-marker',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C8.14 2 5 5.14 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.14 15.86 2 12 2Z" fill="CURRENT_COLOR"/>
          </svg>`,
		},
		{
			name: 'map-marker-account',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C8.14 2 5 5.14 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.14 15.86 2 12 2M12 4C13.1 4 14 4.9 14 6C14 7.11 13.1 8 12 8S10 7.11 10 6C10 4.9 10.9 4 12 4M12 14C10.33 14 8.86 13.15 8 11.85C8 10.53 10.67 9.8 12 9.8S16 10.53 16 11.85C15.14 13.15 13.67 14 12 14Z" fill="CURRENT_COLOR"/>
          </svg>`,
		},
		{
			name: 'tooltip-account',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M20,2H4A2,2 0 0,0 2,4V16A2,2 0 0,0 4,18H8L12,22L16,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M12,4.3C13.5,4.3 14.7,5.5 14.7,7C14.7,8.5 13.5,9.7 12,9.7C10.5,9.7 9.3,8.5 9.3,7C9.3,5.5 10.5,4.3 12,4.3M18,15H6V14.1C6,12.1 10,11 12,11C14,11 18,12.1 18,14.1V15Z" fill="CURRENT_COLOR"/>
          </svg>`,
		},
		{
			name: 'cellphone',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <title>cellphone</title><path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" fill="CURRENT_COLOR"/>
        </svg>`,
		},
		{
			name: 'drone',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>quadcopter</title><path d="M5.5,1C8,1 10,3 10,5.5C10,6.38 9.75,7.2 9.31,7.9L9.41,8H14.59L14.69,7.9C14.25,7.2 14,6.38 14,5.5C14,3 16,1 18.5,1C21,1 23,3 23,5.5C23,8 21,10 18.5,10C17.62,10 16.8,9.75 16.1,9.31L15,10.41V13.59L16.1,14.69C16.8,14.25 17.62,14 18.5,14C21,14 23,16 23,18.5C23,21 21,23 18.5,23C16,23 14,21 14,18.5C14,17.62 14.25,16.8 14.69,16.1L14.59,16H9.41L9.31,16.1C9.75,16.8 10,17.62 10,18.5C10,21 8,23 5.5,23C3,23 1,21 1,18.5C1,16 3,14 5.5,14C6.38,14 7.2,14.25 7.9,14.69L9,13.59V10.41L7.9,9.31C7.2,9.75 6.38,10 5.5,10C3,10 1,8 1,5.5C1,3 3,1 5.5,1M5.5,3A2.5,2.5 0 0,0 3,5.5A2.5,2.5 0 0,0 5.5,8A2.5,2.5 0 0,0 8,5.5A2.5,2.5 0 0,0 5.5,3M5.5,16A2.5,2.5 0 0,0 3,18.5A2.5,2.5 0 0,0 5.5,21A2.5,2.5 0 0,0 8,18.5A2.5,2.5 0 0,0 5.5,16M18.5,3A2.5,2.5 0 0,0 16,5.5A2.5,2.5 0 0,0 18.5,8A2.5,2.5 0 0,0 21,5.5A2.5,2.5 0 0,0 18.5,3M18.5,16A2.5,2.5 0 0,0 16,18.5A2.5,2.5 0 0,0 18.5,21A2.5,2.5 0 0,0 21,18.5A2.5,2.5 0 0,0 18.5,16M3.91,17.25L5.04,17.91C5.17,17.81 5.33,17.75 5.5,17.75A0.75,0.75 0 0,1 6.25,18.5L6.24,18.6L7.37,19.25L7.09,19.75L5.96,19.09C5.83,19.19 5.67,19.25 5.5,19.25A0.75,0.75 0 0,1 4.75,18.5L4.76,18.4L3.63,17.75L3.91,17.25M3.63,6.25L4.76,5.6L4.75,5.5A0.75,0.75 0 0,1 5.5,4.75C5.67,4.75 5.83,4.81 5.96,4.91L7.09,4.25L7.37,4.75L6.24,5.4L6.25,5.5A0.75,0.75 0 0,1 5.5,6.25C5.33,6.25 5.17,6.19 5.04,6.09L3.91,6.75L3.63,6.25M16.91,4.25L18.04,4.91C18.17,4.81 18.33,4.75 18.5,4.75A0.75,0.75 0 0,1 19.25,5.5L19.24,5.6L20.37,6.25L20.09,6.75L18.96,6.09C18.83,6.19 18.67,6.25 18.5,6.25A0.75,0.75 0 0,1 17.75,5.5L17.76,5.4L16.63,4.75L16.91,4.25M16.63,19.25L17.75,18.5A0.75,0.75 0 0,1 18.5,17.75C18.67,17.75 18.83,17.81 18.96,17.91L20.09,17.25L20.37,17.75L19.25,18.5A0.75,0.75 0 0,1 18.5,19.25C18.33,19.25 18.17,19.19 18.04,19.09L16.91,19.75L16.63,19.25Z" fill="CURRENT_COLOR" />
          </svg>`,
		},
		{
			name: 'PTZ camera',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>webcam</title><path d="M12,2A7,7 0 0,1 19,9A7,7 0 0,1 12,16A7,7 0 0,1 5,9A7,7 0 0,1 12,2M12,4A5,5 0 0,0 7,9A5,5 0 0,0 12,14A5,5 0 0,0 17,9A5,5 0 0,0 12,4M12,6A3,3 0 0,1 15,9A3,3 0 0,1 12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6M6,22A2,2 0 0,1 4,20C4,19.62 4.1,19.27 4.29,18.97L6.11,15.81C7.69,17.17 9.75,18 12,18C14.25,18 16.31,17.17 17.89,15.81L19.71,18.97C19.9,19.27 20,19.62 20,20A2,2 0 0,1 18,22H6Z" fill="CURRENT_COLOR" />
          </svg>`,
		},
		{
			name: 'Target',
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>target</title><path d="M11,2V4.07C7.38,4.53 4.53,7.38 4.07,11H2V13H4.07C4.53,16.62 7.38,19.47 11,19.93V22H13V19.93C16.62,19.47 19.47,16.62 19.93,13H22V11H19.93C19.47,7.38 16.62,4.53 13,4.07V2M11,6.08V8H13V6.09C15.5,6.5 17.5,8.5 17.92,11H16V13H17.91C17.5,15.5 15.5,17.5 13,17.92V16H11V17.91C8.5,17.5 6.5,15.5 6.08,13H8V11H6.09C6.5,8.5 8.5,6.5 11,6.08M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z" fill="CURRENT_COLOR" />
          </svg>`,
		},
	];

	const selectedIcon = ref(availableIcons[0]);

	const selectedRgbaColor = ref<{ r: number; g: number; b: number; a: number }>({
		r: 50,
		g: 68,
		b: 158,
		a: 1,
	});

	watch(
		[selectedIcon, selectedRgbaColor],
		() => {
			const icon = selectedIcon.value.svg.replace(
				/CURRENT_COLOR/g,
				`rgba(${selectedRgbaColor.value.r}, ${selectedRgbaColor.value.g}, ${selectedRgbaColor.value.b}, ${selectedRgbaColor.value.a})`
			);
			emit('update:iconProperties', icon);
		},
		{ immediate: true }
	);

	onMounted(() => {
		emit(
			'update:iconProperties',
			selectedIcon.value.svg.replace(
				/CURRENT_COLOR/g,
				`rgba(${selectedRgbaColor.value.r}, ${selectedRgbaColor.value.g}, ${selectedRgbaColor.value.b}, ${selectedRgbaColor.value.a})`
			)
		);
	});

	function selectIcon(icon: { name: string; svg: string }) {
		selectedIcon.value = icon;
	}
</script>

<template>
	<div>
		<h3>Pick an Icon</h3>
		<div style="display: flex; gap: 10px; flex-wrap: wrap">
			<div
				v-for="icon in availableIcons"
				:key="icon.name"
				@click="selectIcon(icon)"
				style="cursor: pointer; border: 1px solid #ccc; padding: 5px; border-radius: 4px">
				<div v-html="icon.svg" style="width: 32px; height: 32px"></div>
			</div>
		</div>
		<div v-if="selectedIcon" style="margin-top: 20px">
			<h4>Selected Icon:</h4>
			<div
				v-html="
					selectedIcon.svg.replace(
						/CURRENT_COLOR/g,
						`rgba(${selectedRgbaColor.r}, ${selectedRgbaColor.g}, ${selectedRgbaColor.b}, ${selectedRgbaColor.a})`
					)
				"
				style="width: 64px; height: 64px"></div>
		</div>
		<v-color-picker style="margin: auto" v-model="selectedRgbaColor" mode="rgba">
		</v-color-picker>
	</div>
</template>

<style scoped></style>
