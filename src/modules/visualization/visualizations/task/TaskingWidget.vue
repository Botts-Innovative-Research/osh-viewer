<script lang="ts" setup>
import {OSHVisualization} from '@/lib/OSHConnectDataStructs';
import {computed, ref, watch} from 'vue';
import {IConSysApiControlStreamProperties} from '../../types/datasource';
import {fetchControlStreamSchema, sendCommand} from '@/modules/visualization/services/controlstream.service';
import {useControlStreamStore} from '@/stores/controlstreamstore';
import {useMapStore} from '@/stores/mapstore';
import {useMapInteractionStore} from '@/stores/mapinteractionstore';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import type {MapPoint} from '@/modules/map/types';

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
const locationPoint = ref<MapPoint>({lat: 0, lon: 0, alt: 0});
const isLocationMapSelect = computed(() => mapInteractionStore.isTaskingLocationSelected);

const formatedItems = computed(() =>
    props.controlstreams.map((cs) => ({title: cs.name, value: cs}))
);


function findLocationCoord(definition: string | undefined): 'lat' | 'lon' | 'alt' | null {
  const def = definition?.toLowerCase() ?? '';
  if (def.includes('latitude')) return 'lat';
  if (def.includes('longitude')) return 'lon';
  if (def.includes('altitude')) return 'alt';
  return null;
}

const locationFieldKeys = computed(() => {
  if (!fetchedSchema.value) return null;
  const keys: Record<string, string> = {};
  let vectorName: string | null = null;

  for (const [name, field] of Object.entries(fetchedSchema.value) as [string, any][]) {
    const role = findLocationCoord(field.definition);
    if (role) {
      keys[role] = name;
    } else if (field.type === 'Vector' && Array.isArray(field.coordinates)) {
      for (const coord of field.coordinates) {
        const coordRole = findLocationCoord(coord.definition);
        if (coordRole) keys[coordRole] = coord.name;
      }
      if (keys.lat && keys.lon) vectorName = name;
    }
  }

  return keys.lat && keys.lon
      ? {latKey: keys.lat, lonKey: keys.lon, altKey: keys.alt ?? null, vectorName}
      : null;
});


const schemaFields = computed(() => {
  if (!fetchedSchema.value) return [];
  const loc = locationFieldKeys.value;
  const excludedNames = new Set<string>();
  if (loc) {
    if (loc.vectorName) excludedNames.add(loc.vectorName);
    excludedNames.add(loc.latKey);
    excludedNames.add(loc.lonKey);
    if (loc.altKey) excludedNames.add(loc.altKey);
  }

  return Object.entries(fetchedSchema.value)
      .filter(([name]) => !excludedNames.has(name))
      .map(([name, field]: [string, any]) => ({
        name,
        type: field.type,
        label: field.label || name,
        definition: field.definition,
        constraint: field.constraint,
        coordinates: field.coordinates,
      }));
});

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

function getDefaultValue(field: any): any {
  if (field.type === 'Vector' && Array.isArray(field.coordinates)) {
    return Object.fromEntries(field.coordinates.map((c: any) => [c.name, 0]));
  }
  if (field.type === 'Quantity' || field.type === 'Count') {
    return field.constraint?.intervals?.[0]?.[0] ?? 0;
  }
  if (field.type === 'Boolean') return false;
  return '';
}

watch(selectedCommand, async (selected) => {
  if (!selected) return;

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
      formValues.value[name] = getDefaultValue(field);
    }
  }
});


function handleSend() {
  if (!selectedCommand.value) return;
  const cs = selectedCommand.value;
  const command: Record<string, any> = {};

  const loc = locationFieldKeys.value;
  if (loc) {
    const coords: Record<string, number> = {
      [loc.latKey]: locationPoint.value.lat,
      [loc.lonKey]: locationPoint.value.lon,
      ...(loc.altKey ? {[loc.altKey]: locationPoint.value.alt ?? 0} : {}),
    };
    if (loc.vectorName) command[loc.vectorName] = coords;
    else Object.assign(command, coords);
  }

  for (const field of schemaFields.value) {
    command[field.name] = formValues.value[field.name] ?? getDefaultValue(field);
  }

  const baseUrl = `${cs.tls ? 'https' : 'http'}://${cs.endpointUrl}`;
  const auth = `${cs.connectorOpts.username}:${cs.connectorOpts.password}`;
  sendCommand(baseUrl, cs.id, {parameters: command}, auth, cs.name);
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
        <template v-slot:item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps">
            <template v-slot:prepend="{ isSelected }">
              <v-checkbox-btn :model-value="isSelected"/>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <v-progress-linear v-if="loading" class="mb-4" indeterminate/>

      <template v-if="fetchedSchema && (schemaFields.length > 0 || locationFieldKeys)">
        <!-- Location (auto-detected from schema) -->
        <div v-if="locationFieldKeys" class="mb-3">
          <div class="text-subtitle-2 mb-1">Location</div>
          <MapPointEditor
              v-model="locationPoint"
              :has-submit="false"
              :hide-alt="!locationFieldKeys.altKey"
              :is-selected="isLocationMapSelect"
              :is-selector-disabled="false"
              @toggle="toggleLocationSelect"
          />
        </div>

        <div v-for="field in schemaFields" :key="field.name" class="mb-3">
          <v-text-field
              v-if="field.type === 'Quantity' || field.type === 'Count'"
              v-model.number="formValues[field.name]"
              :label="field.label"
              :max="field.constraint?.intervals?.[0]?.[1]"
              :min="field.constraint?.intervals?.[0]?.[0]"
              density="compact"
              persistent-hint
              type="number"
              variant="outlined"
          />

          <v-switch
              v-else-if="field.type === 'Boolean'"
              v-model="formValues[field.name]"
              :label="field.label"
              color="primary"
              persistent-hint
          />

          <v-select
              v-else-if="field.type === 'Category' && field.constraint?.values"
              v-model="formValues[field.name]"
              :items="field.constraint.values"
              :label="field.label"
              density="compact"
              persistent-hint
              variant="outlined"
          />

          <div v-else-if="field.type === 'Vector' && field.coordinates">
            <div class="text-subtitle-2 mb-1">{{ field.label || field.name }}</div>
            <v-text-field
                v-for="coord in field.coordinates"
                :key="coord.name"
                v-model.number="formValues[field.name][coord.name]"
                :label="coord.label || coord.name"
                class="mb-2"
                density="compact"
                type="number"
                variant="outlined"
            />
          </div>

          <v-text-field
              v-else
              v-model="formValues[field.name]"
              :label="field.label"
              density="compact"
              persistent-hint
              variant="outlined"
          />
        </div>

        <v-btn
            :disabled="!selectedCommand"
            class="mt-2"
            color="primary"
            variant="tonal"
            @click="handleSend"
        >
          Send Command
        </v-btn>
      </template>
    </v-container>
  </v-sheet>
</template>
