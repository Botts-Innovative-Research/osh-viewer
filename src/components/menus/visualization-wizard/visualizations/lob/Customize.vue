<script setup lang="ts">
import IconControl from '../../viz-components/customizations/IconControl.vue';
import LineColorControl from '../../viz-components/customizations/LineColorControl.vue';
import WeightControl from '../../viz-components/customizations/WeightControl.vue';
import OpacityControl from '../../viz-components/customizations/OpacityControl.vue';
import DistanceKmControl from '../../viz-components/customizations/DistanceKmControl.vue';
import NameControl from '../../viz-components/customizations/NameControl.vue';
import { VisualizationComponentEmits } from '../../VisualizationRegistry';
import { computed, ref } from 'vue';
import { useComponentValidation } from '../../shared/helpers';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const nameValid = ref<boolean>(false)
const valid = computed(() => {
  return nameValid.value
})
useComponentValidation(valid, emit)

</script>

<template>
	<v-card class="pa-4" elevation="2">
		<name-control role="origin" v-model:valid="nameValid"></name-control>
		<icon-control></icon-control>
		<line-color-control></line-color-control>
		<weight-control></weight-control>
		<opacity-control></opacity-control>
		<distance-km-control></distance-km-control>
	</v-card>
</template>
