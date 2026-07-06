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

const toolLabel = computed(() => {
	const parts: { label: string; icon: string; color: string }[] = [];
	if (mapStore.isDriveLocationSelected) parts.push({ label: 'Drive Location', icon: 'mdi-steering', color: 'blue' });
	if (mapStore.isHomeLocationSelected) parts.push({ label: 'Home Location', icon: 'mdi-home-map-marker', color: 'yellow' });
	if (mapStore.selectedWaypoints) parts.push({ label: 'Waypoint Selector', icon: 'mdi-map-marker-path', color: 'green' });
	if (mapStore.isGeoPTZSelected) parts.push({ label: 'GeoPTZ', icon: 'mdi-crosshairs-gps', color: 'red' });
	return parts;
});
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
				<div
					v-for="item in toolLabel"
					:key="item.label"
					class="d-flex align-center ga-2"
					v-show="isActive"
				>
					<v-icon
						:icon="item.icon"
						:color="item.color"
					/>
					<span>{{ item.label }}</span>
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
