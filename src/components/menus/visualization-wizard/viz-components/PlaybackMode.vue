<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mode } from 'osh-js/source/core/datasource/Mode.js'

const props = defineProps<{
  modelValue: Mode
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: Mode): void
}>()

const playbackMode = computed({
  get: () => props.modelValue,
  set: (val: Mode) => emit('update:modelValue', val)
})
const listModes = Object.entries(Mode).map(([key, value]) => ({
  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  value
}))

</script>

<template>
  <v-combobox
    v-model="playbackMode"
    :items="listModes"
    item-title="label"
    item-value="value"
    label="Playback Mode"
    variant="solo"
    density="compact"
  />
</template>

<style scoped>

</style>