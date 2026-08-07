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
const formatedItems = computed(() => {
  return props.controlstreams.map((arr) => ({
    title: arr.name,
    value: arr
  }))
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
})

function handleSend() {
  if (!selectedCommand.value) return;

  const command: Record<string, any> = {};
  const baseUrl = `${selectedCommand.value.tls ? 'https' : 'http'}://${selectedCommand.value.endpointUrl}`;
  const auth = `${selectedCommand.value.connectorOpts.username}:${selectedCommand.value.connectorOpts.password}`;

  console.log('Sending command:', command);
  sendCommand(baseUrl, selectedCommand.value.id, command, auth, selectedCommand.value.name);
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
		</v-container>
	</v-sheet>
</template>
