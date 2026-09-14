<script lang="ts" setup>
import { ref, watch } from 'vue';

const show = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  export: [filename: string];
}>();

const filename = ref('mission');

watch(show, (val) => {
  if (val) {
    filename.value = 'mission';
  }
});

function submit() {
  emit('export', filename.value.trim() || 'mission');
}
</script>

<template>
  <v-dialog
      v-model="show"
      max-width="400"
  >
    <v-card>
      <v-card-title>Export Mission</v-card-title>
      <v-card-text>
        <v-text-field
            v-model="filename"
            autofocus
            density="compact"
            label="Filename"
            suffix=".plan"
            @keyup.enter="submit"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
            variant="text"
            @click="show = false"
        >Cancel</v-btn>
        <v-btn
            color="primary"
            variant="tonal"
            @click="submit"
        >Export</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
