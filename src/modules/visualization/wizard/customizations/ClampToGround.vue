<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const clampToGround = ref<boolean>(true);

watch(clampToGround, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ clampToGround: val });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.clampToGround) {
		vwStore.updateVisualizationCustomizationOptions({
			clampToGround: clampToGround.value,
		});
	} else {
		clampToGround.value = vwStore.visualizationCustomizationOptions.clampToGround;
	}
});
</script>
<template>
	<h3>Clamp To Ground</h3>
	<v-checkbox v-model="clampToGround"> </v-checkbox>
</template>
