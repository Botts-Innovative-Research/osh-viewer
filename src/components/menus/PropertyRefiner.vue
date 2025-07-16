<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils'
import { onMounted, ref } from 'vue'
import { SWEBuilder } from '../../../lib/swe-common-js/utils/SWEBuilder'
import { DataRecord } from '../../../lib/swe-common-js/SweDataTypes'

const obsProps = ref<{ 'definition': string, 'label': string }[]>([])
const dsSchema = ref<any>(null)
const showModal = ref(true)

async function fetchProps() {
  const { ds, observedProps } = mineDatasourceObsProps()
  obsProps.value = observedProps

  const schema = await fetchSchema(ds.datastream)
  dsSchema.value = schema
  console.log('Fetched schema:', dsSchema.value)

  const newSWE = SWEBuilder.createFromObject(schema) as DataRecord;
  console.log('New SWE Object:', newSWE);
  console.log('Property Names:', newSWE.propertyNames());
}

onMounted(async () => {
  await fetchProps()
})
</script>

<template>
  <v-dialog v-model="showModal" persistent max-width="600px">
    <v-card>
      <v-card-title>
        Refine Properties
      </v-card-title>
      <v-card-text>
        <div v-if="dsSchema">
          <div v-for="property in dsSchema.recordSchema.fields" :key="property.definition" class="mb-2">
            <div class="property-row no-wrap">
              <span class="pa-2 property-label font-weight-bold">{{ property.label }}</span>
              <span class="pa-2 property-name text-grey-darken-1">{{ property.name }}</span>
              <span class="pa-2 property-definition text-caption text-grey">{{ property.definition }}</span>
            </div>
          </div>
        </div>
        <div v-else>
          Loading properties...
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="showModal = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.property-row {
  display: flex;
  align-items: center;
}
</style>