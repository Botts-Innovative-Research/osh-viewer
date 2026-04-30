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
import IconColorControl from '../../viz-components/customizations/IconColorControl.vue';
import { v } from 'vue-router/dist/router-CWoNjPRp.mjs';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>()
const nameValid = ref<boolean>(false)
const valid = computed(() => {
  return nameValid.value
})
useComponentValidation(valid, emit)

</script>

<template>
	<name-control role="origin" v-model:valid="nameValid"></name-control>
	<icon-control></icon-control>
	<v-row class="justify-space-between pa-4">
		<v-col cols="auto">
			<icon-color-control></icon-color-control>
		</v-col>
		<v-col cols="auto">
			<line-color-control></line-color-control>
		</v-col>
	</v-row>
	<weight-control></weight-control>
	<opacity-control></opacity-control>
	<distance-km-control></distance-km-control>
</template>
