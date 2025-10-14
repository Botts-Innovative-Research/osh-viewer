<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils'
import { onMounted, ref, watch } from 'vue'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { useUIStore } from '@/stores/uistore'

const props = defineProps<{
  title: string;
}>()

const chartDS = ref<any>(null)
const selectedProperty = ref<SchemaFieldProperty | null>(null)
const obsProps = ref<{ 'definition': string, 'label': string }[]>([])
const dsSchema = ref<any>(null)


const emit = defineEmits(['update:selectedProperty'])

async function fetchProps() {
  const { ds, observedProps } = mineDatasourceObsProps()
  chartDS.value = ds
  obsProps.value = observedProps

  const schema = await fetchSchema(ds.datastream)
  dsSchema.value = schema
}

onMounted(async () => {
  fetchProps()
})

watch(selectedProperty, (val) => {
  emit('update:selectedProperty', val)
})
</script>
 <template>
  <v-card class="pa-2" elevation="2">
    <h3>{{ props.title }}</h3>
    <v-select
      v-if="dsSchema"
      v-model="selectedProperty"
      :items="dsSchema.recordSchema.fields"
      item-value="definition"
      item-title="label"
      label="Select Property from Datasource"
      return-object
    >
      <!-- How each option in the dropdown looks -->
      <template v-slot:item="{props, item }">
        <div class="property-row no-wrap custom-pointer" v-bind="props">
          <span class="pa-2 property-label font-weight-bold">{{ item.raw.label }}</span>
          <span class="pa-2 property-name text-grey-darken-1">| {{ item.raw.name }} |</span>
          <span class="pa-2 property-definition text-caption text-grey">definition: {{ item.raw.definition }}</span>
        </div>
      </template>
      <!-- How the selected option appears inside the input -->
      <template v-slot:selection="{ item }">
        <div class="property-row no-wrap custom-pointer" v-if="item">
          <span class="pa-2 property-label font-weight-bold">{{ item.raw.label }}</span>
          <span class="pa-2 property-name text-grey-darken-1">{{ item.raw.name }}</span>
          <span class="pa-2 property-definition text-caption text-grey">{{ item.raw.definition }}</span>
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