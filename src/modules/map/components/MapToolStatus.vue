<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useMapStore } from '@/stores/mapstore';
import { useSettingsStore } from '@/stores/settingsstore';
import { ICON_BASE, ICON_OPTIONS, iconPathBuilder } from '@/lib/icons';
import { getColoredIconUrl } from '../services/colorId.service';

const mapStore = useMapStore();
const settingsStore = useSettingsStore();

const isActive = computed(() => {
	return !!mapStore.isGeoPTZSelected || !!mapStore.selectedWaypoints || !!mapStore.isDriveLocationSelected || !!mapStore.isHomeLocationSelected;
});

const isHovered = ref(false);
</script>

<template>
	<v-fade-transition>
		<v-card
			class="ma-0 elevation-10"
			:style="{
				position: 'absolute',
				zIndex: 2000,
				marginTop: '1%',
				marginLeft: '1%',
			}"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
			v-show="isActive"
		>
			<v-card-text class="d-flex flex-column ga-2 pa-2">
				<!-- GeoPTZ -->
				<div
					class="d-flex align-center ga-2"
					v-show="mapStore.isGeoPTZSelected"
				>
					<v-icon
						icon="mdi-crosshairs-gps"
						color="green"
					/>
					<span>GeoPTZ</span>
					<transition name="fade-slide-x">
						<span
							v-if="isHovered"
							class="ml-1 text-grey"
						>
							cursor active
						</span>
					</transition>
				</div>
				<!-- Mission Builder -->
				<div
					class="d-flex align-center ga-2"
					v-show="!!mapStore.selectedWaypoints || !!mapStore.isHomeLocationSelected || !!mapStore.isDriveLocationSelected"
				>
					<v-icon
						icon="mdi-crosshairs-gps"
						color="green"
					/>
					<span>Mission Builder</span>
					<transition name="fade-slide-x">
						<span
							v-if="isHovered"
							class="ml-1 text-grey"
						>
							cursor active
						</span>
					</transition>
				</div>
			</v-card-text>
		</v-card>
	</v-fade-transition>
</template>

<style scoped>
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
