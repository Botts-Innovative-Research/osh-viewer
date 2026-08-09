<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ref, watch, computed } from 'vue';
import { IConSysApiControlStreamProperties } from '../../types/datasource';
import { fetchControlStreamSchema, sendCommand } from '@/modules/visualization/services/controlstream.service';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { useMapStore } from '@/stores/mapstore';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import type { MapPoint } from '@/modules/map/types';

const props = defineProps<{
	visualization: OSHVisualization;
	controlstreams: IConSysApiControlStreamProperties[];
}>();

const controlStreamStore = useControlStreamStore();
const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();

const selectedCommand = ref<IConSysApiControlStreamProperties | null>(null);
const fetchedSchema = ref<Record<string, any> | null>(null);
const formValues = ref<Record<string, any>>({});
const loading = ref(false);
const locationPoint = ref<MapPoint>({ lat: 0, lon: 0, alt: 0 });
const isLocationMapSelect = computed(() => mapInteractionStore.isTaskingLocationSelected);

const formatedItems = computed(() => {
  return props.controlstreams.map((arr) => ({
    title: arr.name,
    value: arr
  }))
})

const locationFieldKeys = computed(() => {
  if (!fetchedSchema.value) return null;
  let latKey: string | null = null;
  let lonKey: string | null = null;
  let altKey: string | null = null;

  for (const [name, field] of Object.entries(fetchedSchema.value) as [string, any][]) {
    if (field.definition?.toLowerCase().includes("latitude")) latKey = name;
    else if (field.definition?.toLowerCase().includes("longitude")) lonKey = name;
    else if (field.definition?.toLowerCase().includes("altitude")) altKey = name;
  }

  if (latKey && lonKey) {
    return { latKey, lonKey, altKey };
  }
  return null;
})

const schemaFields = computed(() => {
  if (!fetchedSchema.value) return [];
  const locationKeys = locationFieldKeys.value;
  return Object.entries(fetchedSchema.value)
    .filter(([name]) => {
      if (locationKeys) {
        if (name === locationKeys.latKey || name === locationKeys.lonKey || name === locationKeys.altKey) {
          return false;
        }
      }
      return true;
    })
    .map(([name, field]: [string, any]) => ({
      name,
      type: field.type,
      label: field.label || name,
      definition: field.definition,
      constraint: field.constraint,
      coordinates: field.coordinates,
    }));
})

watch(
  () => mapStore.currentLLA,
  (newVal) => {
    if (isLocationMapSelect.value && newVal) {
      locationPoint.value = {
        lat: newVal.latitude,
        lon: newVal.longitude,
        alt: newVal.altitude ?? 0,
      };
    }
  }
);

function toggleLocationSelect() {
  mapInteractionStore.toggleTool('taskingLocation');
}

watch(selectedCommand, async (selected) => {
  if (!selected) return;
  console.log('Selected control stream:', selected);

  fetchedSchema.value = null;
  formValues.value = {};
  loading.value = true;

  const cs = controlStreamStore.getControlStreamsById([selected.id])[0];
  if (!cs) {
    console.warn('Control stream not found for id:', selected.id);
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

  const locationKeys = locationFieldKeys.value;
  if (locationKeys) {
    command[locationKeys.latKey] = locationPoint.value.lat;
    command[locationKeys.lonKey] = locationPoint.value.lon;
    if (locationKeys.altKey) {
      command[locationKeys.altKey] = locationPoint.value.alt ?? 0;
    }
  }

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
  console.log('Sending command:', commandParam);
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

      <template v-if="fetchedSchema && (schemaFields.length > 0 || locationFieldKeys)">

        <div v-if="locationFieldKeys" class="mb-3">
          <div class="text-subtitle-2 mb-1">Location</div>
          <MapPointEditor
              v-model="locationPoint"
              :is-selected="isLocationMapSelect"
              :is-selector-disabled="false"
              :hide-alt="!locationFieldKeys.altKey"
              :has-submit="false"
              @toggle="toggleLocationSelect"
          />
        </div>

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
