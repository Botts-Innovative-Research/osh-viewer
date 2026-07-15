<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{
  waypointCount: number;
}>();

const show = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  save: [name: string, desc: string];
}>();

const missionName = ref('');
const missionDesc = ref('');

function defaultMissionName() {
  const now = new Date();
  const datePart = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `Mission ${datePart} ${timePart}`;
}

watch(show, (val) => {
  if (val) {
    missionName.value = defaultMissionName();
    missionDesc.value = '';
  }
});

function save() {
  const name = missionName.value.trim();
  if (!name) return;
  emit('save', name, missionDesc.value.trim());
  missionName.value = '';
  missionDesc.value = '';
}

function cancel() {
  show.value = false;
  missionName.value = '';
  missionDesc.value = '';
}
</script>

<template>
  <v-dialog
      v-model="show"
      max-width="400"
  >
    <v-card
        class="pa-2"
        rounded="lg"
    >
      <v-card-title>Save mission to library</v-card-title>

      <v-card-text>
        <v-text-field
            v-model="missionName"
            :rules="[() => !!missionName.trim() || 'Name is required']"
            autofocus
            density="comfortable"
            variant="solo-filled"
            class="mb-4"
            label="Mission Name"
            @keyup.enter="save"
        />

        <v-textarea
            v-model="missionDesc"
            density="comfortable"
            variant="solo-filled"
            flat
            label="Description (optional)"
            rows="4"
            auto-grow
            class="mb-2"
        />
      </v-card-text>


      <v-card-actions class="px-4 py-3">
        <v-btn
            variant="text"
            @click="cancel"
        >Cancel</v-btn
        >
        <v-btn
            color="primary"
            variant="tonal"
            @click="save"
        >Save</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>