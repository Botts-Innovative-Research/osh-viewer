<script setup lang="ts">
import { ref } from 'vue';
import { useMapStore } from '@/stores/mapstore';

const mapStore = useMapStore();

const isHovered = ref(false);
</script>

<template>
	<v-card
		class="pa-2 elevation-10"
		:style="{
			position: 'absolute',
			zIndex: 2000,
			marginTop: '1%',
			marginLeft: '1%',
		}"
		@mouseenter="isHovered = true"
		@mouseleave="isHovered = false"
	>
		<v-card-text class="d-flex flex-column ga-2">
			<!-- GeoPTZ -->
			<div class="d-flex align-center ga-2">
				<div
					class="status-dot"
					:class="mapStore.isGeoPTZSelected ? 'bg-green' : 'bg-grey'"
				/>

				<span>GeoPTZ</span>

				<transition name="fade-slide-x">
					<span
						v-if="isHovered"
						class="ml-1 text-grey"
					>
						{{ mapStore.isGeoPTZSelected ? 'selected' : 'not selected' }}
					</span>
				</transition>
			</div>

			<!-- Mission Builder -->
			<div class="d-flex align-center ga-2">
				<div
					class="status-dot"
					:class="mapStore.selectedWaypoints ? 'bg-green' : 'bg-grey'"
				/>

				<span>Mission Builder</span>

				<transition name="fade-slide-x">
					<span
						v-if="isHovered"
						class="ml-1 text-grey"
					>
						{{ mapStore.selectedWaypoints ? 'selected' : 'not selected' }}
					</span>
				</transition>
			</div>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.status-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	flex-shrink: 0;
}

.fade-slide-x-enter-active,
.fade-slide-x-leave-active {
	transition: all 0.2s ease;
}

.fade-slide-x-enter-from,
.fade-slide-x-leave-to {
	opacity: 0;
	transform: translateX(-8px);
}
</style>
