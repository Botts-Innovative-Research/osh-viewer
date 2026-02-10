<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import BackgroundColorControl from '../../viz-components/customizations/BackgroundColorControl.vue';
import LineColorControl from '../../viz-components/customizations/LineColorControl.vue';
import NameControl from '../../viz-components/customizations/NameControl.vue';
import { computed, ref, watch } from 'vue';

const vizwizStore = useVizWizStore();
const defaultValue = ref<string>('')

watch(() => vizwizStore.dsConfig.y, (val) => {
  if (val && val.label) {
    defaultValue.value = val.label + (val.uom ? ` (${val.uom})` : '')
  }
}, { immediate: true, deep: true })

</script>

<template>
  <name-control :default-name="defaultValue"></name-control>
  <LineColorControl />
  <BackgroundColorControl />
</template>