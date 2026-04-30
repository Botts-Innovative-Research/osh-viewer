<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted, ref } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";
import { VisualizationComponentEmits } from '../../VisualizationRegistry';
import { useComponentValidation } from '../../shared/helpers';


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  video: computed({
    get: () => vizwizStore.dsConfig.video?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("video", { selected: val })
  }),
  ptz: computed({
    get: () => vizwizStore.csConfig.ptz?.selected ?? false,
    set: (val: boolean) => {
      if (val) {
        vizwizStore.updateCsConfig("ptz", { selected: val })
      } else {
        delete vizwizStore.csConfig.ptz
      }
    }
  }),
})

// Initialize dsConfig with video selected by default when mounted
onMounted(() => {
  if (!vizwizStore.dsConfig.video) {
    vizwizStore.updateDsConfig("video", { selected: true })
  }
})

// If dsConfig is reset, ensure video is selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.video) {
    vizwizStore.updateDsConfig("video", { selected: true })
  }
}, { deep: true })

// Validation: at least video must be selected and other selected roles must be configured
const emit = defineEmits<VisualizationComponentEmits>()
const roleVideoValid = ref<boolean>(false)
const rolePtzValid = ref<boolean>(false)
const valid = computed(() => {
  // If role is checked, must be valid. If not checked, ignore validity
  const videoValid = checkedRoles.video ? roleVideoValid.value : true
  const ptzValid = checkedRoles.ptz ? rolePtzValid.value : true
  return videoValid && ptzValid
})
useComponentValidation(valid, emit)

</script>
<template>
  <!-- Video -->
  <v-container>
    <v-checkbox label="Video" v-model="checkedRoles.video" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.video" role="video" v-model:valid="roleVideoValid" />
  </v-container>
  <!-- PTZ -->
  <v-container>
    <v-checkbox label="PTZ Control" v-model="checkedRoles.ptz"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.ptz" role="ptz" :show-property-selector="false" v-model:valid="rolePtzValid" />
  </v-container>
</template>

<style scoped></style>