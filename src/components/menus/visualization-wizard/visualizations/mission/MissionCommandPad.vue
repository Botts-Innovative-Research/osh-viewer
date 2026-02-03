<script setup lang="ts">
import {computed, ref} from 'vue';
import {sendCommand} from '@/lib/ControlstreamUtils';

const props = defineProps({
  controlstream: {
    type: Object,
    required: true,
  }
});

const commandBaseUrl = computed(() => {
  const protocol = props.controlstream.tls ? 'https' : 'http';
  return `${protocol}://${props.controlstream.endpointUrl}`;
});

const csAuth = computed(() => {
  return {
    username: props.controlstream.connectorOpts.username,
    password: props.controlstream.connectorOpts.password
  };
});

function sendMissionCommand(command: string) {
  const payload = {
    parameters: {
      missionCommand: command
    }
  };
  console.log(`[MissionCommandPad] Sending ${command} command:`, payload);
  sendCommand(
      commandBaseUrl.value,
      props.controlstream.id,
      payload,
      `${csAuth.value.username}:${csAuth.value.password}`
  );
}



function pauseMission() {
  // sendMissionCommand('PAUSE');
}

function returnToHome() {
  // sendMissionCommand('RTL');
}

function land() {
  // sendMissionCommand('LAND');
}

function cancel() {
  // sendMissionCommand('CANCEL');
}

function resumeMission() {
  // sendMissionCommand('RESUME');
}


const isPaused = ref(false);

function toggle() {
  console.log('[MissionCommandPad] toggle called, isPaused:', isPaused.value);
  if (isPaused.value) {
    resumeMission();
  } else {
    pauseMission();
  }
  isPaused.value = !isPaused.value;
  console.log('[MissionCommandPad] isPaused now:', isPaused.value);
}
</script>

<template>
  <v-card class="pa-3">
    <v-card-title class="text-subtitle-1 pa-0 mb-2">
      Mission Control
    </v-card-title>

    <v-row dense>

      <v-col cols="12" sm="3">
        <v-btn
            icon
            :color="isPaused ? 'primary' : 'grey'"
            @click="toggle"
        >
          <v-icon>{{ isPaused ? 'mdi-play-circle' : 'mdi-pause-circle' }}</v-icon>
          <v-tooltip activator="parent" location="top">
            {{ isPaused ? 'Resume Mission' : 'Pause Mission' }}
          </v-tooltip>
        </v-btn>
      </v-col>

      <v-col cols="12" sm="3">
        <v-btn
            color="info"
            icon
            @click="returnToHome"
        >
          <v-icon>{{ 'mdi-home' }}</v-icon>
          <v-tooltip activator="parent" location="bottom"> Return to Launch </v-tooltip>
        </v-btn>
      </v-col>

      <v-col cols="12" sm="3">
        <v-btn
            icon
            @click="land"
            color="grey"
        >
          <v-icon>{{ 'mdi-airplane-landing' }}</v-icon>
          <v-tooltip activator="parent" location="bottom"> Land </v-tooltip>
        </v-btn>
      </v-col>

      <v-col cols="12" sm="3">
        <v-btn
            icon
            @click="cancel"
            color="error"
        >
          <v-icon>{{ 'mdi-cancel' }}</v-icon>
          <v-tooltip activator="parent" location="bottom"> Cancel </v-tooltip>
        </v-btn>
      </v-col>

    </v-row>
  </v-card>
</template>

<style scoped>
</style>