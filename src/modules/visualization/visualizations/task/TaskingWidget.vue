<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ref, watch } from 'vue';
import { IConSysApiControlStreamProperties } from '../../types/datasource';
import { computed } from 'vue';
import { fetchControlStreamSchema, sendCommand } from '@/modules/visualization/services/controlstream.service';
import { useControlStreamStore } from '@/stores/controlstreamstore';

const props = defineProps<{
	visualization: OSHVisualization;
	controlstreams: IConSysApiControlStreamProperties[];
}>();

const controlStreamStore = useControlStreamStore();
const selectedCommand = ref<IConSysApiControlStreamProperties | null>(null);
const fetchedSchema = ref<Record<string, any> | null>(null);
const formValues = ref<Record<string, any>>({});
const loading = ref(false);

const formatedItems = computed(() => {
  return props.controlstreams.map((arr) => ({
    title: arr.name,
    value: arr
  }))
})

const schemaFields = computed(() => {
  if (!fetchedSchema.value) return [];
  return Object.entries(fetchedSchema.value).map(([name, field]: [string, any]) => ({
    name,
    type: field.type,
    label: field.label || name,
    definition: field.definition,
    constraint: field.constraint,
    fields: field.fields,
    coordinates: field.coordinates,
    referenceFrame: field.referenceFrame,
  }));
})

watch(selectedCommand, async (selected) => {
  if (!selected) return;
  console.log('Selected control stream:', selected);

  fetchedSchema.value = null;
  formValues.value = {};
  loading.value = true;

  const cs = controlStreamStore.getControlStreamsById([selected.id])[0];
  if (!cs) {
    console.warn('OSHControlStream not found for id:', selected.id);
    loading.value = false;
    return;
  }

  const schema = await fetchControlStreamSchema(cs.controlstream.properties, cs.controlstream.networkProperties);
  fetchedSchema.value = schema;
  loading.value = false;

  if (schema) {
    for (const [name, field] of Object.entries(schema) as [string, any][]) {
      if (field.type === 'Vector' && Array.isArray(field.coordinates)) {
        const coordValues: Record<string, number> = {};
        for (const coord of field.coordinates) {
          coordValues[coord.name] = 0;
        }
        formValues.value[name] = coordValues;
      } else if (field.type === 'Quantity' || field.type === 'Count') {
        formValues.value[name] = field.constraint?.intervals?.[0]?.[0] ?? 0;
      } else if (field.type === 'Boolean') {
        formValues.value[name] = false;
      } else {
        formValues.value[name] = '';
      }
    }
  }

  console.log('Fetched schema:', schema);
})

function handleSend() {
  if (!selectedCommand.value) return;

  const command: Record<string, any> = {};
  for (const field of schemaFields.value) {
    const val = formValues.value[field.name];
    if (val !== '' && val !== null && val !== undefined) {
      command[field.name] = val;
    }
  }

  const baseUrl = `${selectedCommand.value.tls ? 'https' : 'http'}://${selectedCommand.value.endpointUrl}`;
  const auth = `${selectedCommand.value.connectorOpts.username}:${selectedCommand.value.connectorOpts.password}`;

  const commandParam = {
    parameters: command,
  };
  console.log('Sending command:', command);
  console.log('Sending command param:', commandParam);
  sendCommand(baseUrl, selectedCommand.value.id, commandParam, auth, selectedCommand.value.name);
}
</script>

<template>
	<v-sheet>
		<v-container>
      <v-select
          v-model="selectedCommand"
          :items="formatedItems"
          item-title="title"
          item-value="value"
          label="Control Stream"
      >
        <template v-slot:item="{item, props: itemProps }">
          <v-list-item v-bind="itemProps">
            <template v-slot:prepend="{ isSelected }">
              <v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
            </template>
          </v-list-item>
        </template>
      </v-select>


      <v-progress-linear v-if="loading" indeterminate class="mb-4" />

      <template v-if="fetchedSchema && schemaFields.length > 0">
        <div v-for="field in schemaFields" :key="field.name" class="mb-3">

          <v-text-field
              v-if="field.type === 'Quantity' || field.type === 'Count'"
              v-model.number="formValues[field.name]"
              :label="field.label"
              type="number"
              :min="field.constraint?.intervals?.[0]?.[0]"
              :max="field.constraint?.intervals?.[0]?.[1]"
              variant="outlined"
              density="compact"
              :hint="field.definition"
              persistent-hint
          />

          <v-switch
              v-else-if="field.type === 'Boolean'"
              v-model="formValues[field.name]"
              :label="field.label"
              color="primary"
              :hint="field.definition"
              persistent-hint
          />

<!--          <v-btn-->
<!--              v-else-if="field.type === 'Boolean'"-->
<!--              block-->
<!--              color="primary"-->
<!--              variant="tonal"-->
<!--              v-model="formValues[field.name]"-->
<!--              :hint="field.definition"-->
<!--              persistent-hint-->
<!--          >-->
<!--            {{ field.label }}-->
<!--          </v-btn>-->

          <v-select
              v-else-if="field.type === 'Category' && field.constraint?.values"
              v-model="formValues[field.name]"
              :items="field.constraint.values"
              :label="field.label"
              variant="outlined"
              density="compact"
              :hint="field.definition"
              persistent-hint
          />

          <div v-else-if="field.type === 'Vector' && field.coordinates">
            <div class="text-subtitle-2 mb-1">{{ field.label || field.name }}</div>
            <v-text-field
                v-for="coord in field.coordinates"
                :key="coord.name"
                v-model.number="formValues[field.name][coord.name]"
                :label="coord.label || coord.name"
                type="number"
                variant="outlined"
                density="compact"
                :hint="`${coord.definition ?? ''}${coord.uom?.code ? ' (' + coord.uom.code + ')' : ''}`"
                persistent-hint
                class="mb-2"
            />
          </div>

          <v-text-field
              v-else
              v-model="formValues[field.name]"
              :label="field.label"
              variant="outlined"
              density="compact"
              :hint="field.definition"
              persistent-hint
          />
        </div>

        <v-btn
            color="primary"
            variant="tonal"
            @click="handleSend"
            :disabled="!selectedCommand"
            class="mt-2"
        >
          Send Command
        </v-btn>
      </template>
		</v-container>
	</v-sheet>
</template>
