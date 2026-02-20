<script setup lang="ts">
import IconControl from '../../viz-components/customizations/IconControl.vue';
import LineColorControl from '../../viz-components/customizations/LineColorControl.vue';
import WeightControl from '../../viz-components/customizations/WeightControl.vue';
import OpacityControl from '../../viz-components/customizations/OpacityControl.vue';
import DistanceKmControl from '../../viz-components/customizations/DistanceKmControl.vue';
import NameControl from '../../viz-components/customizations/NameControl.vue';
</script>

<template>
	<v-card class="pa-4" elevation="2">
		<name-control role="origin"></name-control>
		<icon-control></icon-control>
		<line-color-control></line-color-control>
		<weight-control></weight-control>
		<opacity-control></opacity-control>
		<distance-km-control></distance-km-control>
	</v-card>
</template>
