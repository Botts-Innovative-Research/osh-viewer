<script setup lang="ts">
import {computed, ref} from 'vue';
import {sendCommand} from '@/lib/ControlstreamUtils';
import Joystick from "@/components/menus/visualization-wizard/visualizations/mission/Joystick.vue";
import DPad from "@/components/menus/visualization-wizard/visualizations/mission/DPad.vue";

const props = defineProps({
  controlstreams: {
    type: Array,
    required: true,
    default: () => [],
  }
});

function getControlstreamByRole(role: string) {
  return props.controlstreams.find((cs: any) => cs.properties && cs.properties[role]);
}

const pauseControlstream = computed(() => getControlstreamByRole('pause'));
const rtlControlstream = computed(() => getControlstreamByRole('rtl'));
const landControlstream = computed(() => getControlstreamByRole('land'));
const offboardControlstream = computed(() => getControlstreamByRole('offboard'));

function getControlstreamConfig(cs: any) {
  if (!cs) return null;
  const protocol = cs.tls ? 'https' : 'http';
  return {
    baseUrl: `${protocol}://${cs.endpointUrl}`,
    id: cs.id,
    auth: `${cs.connectorOpts.username}:${cs.connectorOpts.password}`
  };
}

function sendCommandToRole(role: string, payload: any) {
  const cs = getControlstreamByRole(role);
  if (!cs) {
    console.warn(`[MissionCommandPad] No controlstream configured for role: ${role}`);
    return;
  }

  const config = getControlstreamConfig(cs);
  if (!config) return;

  console.log(`[MissionCommandPad] Sending command to ${role}:`, payload);
  sendCommand(
      config.baseUrl,
      config.id,
      payload,
      config.auth
  );
}

function pauseMission() {
  const payload = {
    parameters: {
      Land: true
    }
  };
  sendCommandToRole('pause', payload);
}

function returnToLaunch() {
  const payload = {
    parameters: {}
  };
  sendCommandToRole('rtl',  payload);
}

function land() {
  const payload = {
    parameters: {
      disarm: true
    }
  };
  sendCommandToRole('land', payload);
}

function cancel() {
  const payload = {
    parameters: {}
  };
    sendCommandToRole('cancel',  payload);
}

function resumeMission() {
  const payload = {
    parameters: {}
  };
  sendCommandToRole('resume',  payload);
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

function handleJoystickMove(data: { x: number, y: number, direction: string, magnitude: number }) {
  console.log('[MissionCommandPad] Joystick move:', data);
  const sensitivity = 10.0;

  const payload = {
    parameters: {
      velocity: {
        vx: data.x * sensitivity,
        vy: -data.y * sensitivity,
        vz: sensitivity,
      },
      yawRate: 100
    }
  };

  sendCommandToRole('offboard',  payload);
}

function handleJoystickStop() {
  console.log('[MissionCommandPad] Joystick released');

  const payload = {
    parameters: {
      velocity: {
        vx: 0,
        vy: 0,
        vz: 0
      },
      yawRate: 0
    }
  };

  // sendCommandToRole('pause',  payload);
}

</script>

<template>
  <v-card class="pa-4 mission-control-card">
    <v-card-title class="text-subtitle-1 pa-0 mb-3">
      Mission Control
    </v-card-title>

    <div class="controls-wrapper mb-4">
      <v-row dense align="center" justify="space-around">
        <v-col cols="auto" class="control-column">
          <div class="mb-1">Movement</div>
          <Joystick
              :size="150"
              :max-distance="60"
              @move="handleJoystickMove"
              @stop="handleJoystickStop"
          />
        </v-col>

        <v-col cols="auto" class="control-column">
          <div class="mb-1">Altitude</div>
          <DPad
              @up="handleDPadUp"
              @down="handleDPadDown"
              @release="handleDPadRelease"
          />
        </v-col>
      </v-row>
    </div>

    <v-divider class="mb-3"></v-divider>

    <v-row dense>
      <v-col cols="6" sm="4">
        <v-btn
            block
            variant="tonal"
            :color="isPaused ? 'primary' : 'grey'"
            @click="toggle"
            class="command-btn"
        >
          <v-icon start>{{ isPaused ? 'mdi-play-circle' : 'mdi-pause-circle' }}</v-icon>
          {{ isPaused ? 'Resume' : 'Pause' }}
        </v-btn>
      </v-col>

      <v-col cols="6" sm="4">
        <v-btn
            block
            variant="tonal"
            color="info"
            @click="returnToLaunch"
            class="command-btn"
        >
          <v-icon start>mdi-home</v-icon>
          RTL
        </v-btn>
      </v-col>

      <v-col cols="6" sm="4">
        <v-btn
            block
            variant="tonal"
            color="grey"
            @click="land"
            class="command-btn"
        >
          <v-icon start>mdi-airplane-landing</v-icon>
          Land
        </v-btn>
      </v-col>

<!--      <v-col cols="6" sm="3">-->
<!--        <v-btn-->
<!--            block-->
<!--            variant="tonal"-->
<!--            color="error"-->
<!--            @click="cancel"-->
<!--            class="command-btn"-->
<!--        >-->
<!--          <v-icon start>mdi-cancel</v-icon>-->
<!--          Cancel-->
<!--        </v-btn>-->
<!--      </v-col>-->
    </v-row>
  </v-card>
</template>

<style scoped>
.mission-control-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.controls-wrapper {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.command-btn {
  text-transform: none;
  font-weight: 500;
}
</style>