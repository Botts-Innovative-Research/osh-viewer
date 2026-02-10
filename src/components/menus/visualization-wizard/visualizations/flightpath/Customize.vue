<script setup lang="ts">

import WeightControl from "@/components/menus/visualization-wizard/viz-components/customizations/WeightControl.vue";
import OpacityControl from "@/components/menus/visualization-wizard/viz-components/customizations/OpacityControl.vue";
import LineColorControl from "@/components/menus/visualization-wizard/viz-components/customizations/LineColorControl.vue";
import SmoothFactor from "@/components/menus/visualization-wizard/viz-components/customizations/SmoothFactor.vue";
import MaxPoints from "@/components/menus/visualization-wizard/viz-components/customizations/MaxPoints.vue";
import ClampToGround from "@/components/menus/visualization-wizard/viz-components/customizations/ClampToGround.vue";
import NameControl from "../../viz-components/customizations/NameControl.vue";
</script>

<template>
  <v-card class="pa-4" elevation="2">
    <name-control default-name="New FlightPath"></name-control>
<!--    <line-color-control />-->
<!--    <weight-control />-->
<!--    <opacity-control />-->
<!--    <smoothFactor />-->
<!--    <maxPoints />-->
<!--    <clampToGround />-->
  </v-card>
</template>
