<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDataStreamStore } from '@/stores/datastreamstore'
import { ref, watch } from 'vue'

const props = defineProps<{ title: string }>()
const emit = defineEmits(['update:addDatastream'])

const { dataStreams } = storeToRefs(useDataStreamStore())

const datastream = ref(null)

watch(datastream, (val) => {
  emit('update:addDatastream', val)
})

</script>
<template>
  <v-card class="pa-2" elevation="2">
    <h3>{{ props.title }}</h3>
    <v-select
      v-model="datastream"
      :items="dataStreams"
      item-value="uuid"
      item-title="name"
      label="Select another datastream"
      return-object
    >
      <!-- Option formatting -->
      <template v-slot:item="{ props, item }">
        <div class="property-row no-wrap custom-pointer" v-bind="props">
          <span class="pa-2 property-name text-grey-darken-1">| {{ item.raw.name }} |</span>
          <span class="pa-2 property-id text-grey-darken-1">| {{ item.raw.id }} |</span>
        </div>
      </template>

      <!-- Selected value formatting -->
      <template v-slot:selection="{ item }">
        <div class="property-row no-wrap custom-pointer" v-if="item">
          <span class="pa-2 property-name text-grey-darken-1">{{ item.raw.name }}</span>
          <span class="pa-2 property-id text-grey-darken-1">| {{ item.raw.id }} |</span>
        </div>
      </template>
    </v-select>
  </v-card>
</template>


<style scoped>
.custom-pointer {
  cursor: default; /* Change to your desired cursor style (e.g., text, default, help, wait) */
}
</style>