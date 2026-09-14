<script setup lang="ts">
import { useMapStore } from '@/stores/mapstore';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

const mapStore = useMapStore();
const { tempLLA } = storeToRefs(mapStore);

const visible = ref(false);

watch(
	tempLLA,
	(lla) => {
		if (lla) {
			visible.value = true;
		} else visible.value = false;
	},
	{ deep: true }
);
</script>
<template>
	<v-fade-transition>
		<v-card
			v-if="visible"
			min-width="220"
			class="menu-container"
		>
			<div>
				[ {{ tempLLA?.lat.toFixed(6) }}, {{ tempLLA?.lon.toFixed(6) }},
				{{ tempLLA?.alt.toFixed(2) }} m ]
			</div>
		</v-card>
	</v-fade-transition>
</template>
<style scoped>
.menu-container {
	position: absolute;
	bottom: 0;
	right: 1%;
	margin-bottom: 1%;
	transform: translateY(-50%);
	z-index: 2200;
}
</style>
