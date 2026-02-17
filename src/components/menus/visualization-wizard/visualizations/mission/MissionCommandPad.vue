<script setup lang="ts">
import {computed, ref} from 'vue';
import {sendCommand} from '@/lib/ControlstreamUtils';

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

const xVelocity = ref<number>(0.0);
const yVelocity = ref<number>(0.0);
const zVelocity = ref<number>(0.0);
const yawRate = ref<number>(0.0);
const takeOffAlt = ref<number>(0.0);

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
  // sendCommandToRole('rtl',  payload);

  console.log("RTL CONTROL: NOT IMPLEMENTED")
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
  // sendCommandToRole('resume',  payload);
  console.log("RESUME CONTROL: NOT IMPLEMENTED")
}

function offboard() {
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

  sendCommandToRole('offboard',  payload);
}

function takeoffCommand() {
  const payload = {
    parameters: {
      TakeoffAltitudeAGL: takeOffAlt.value
    }
  };

  sendCommandToRole('takeoff',  payload);
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
  <v-card class="pa-4 mission-control-card"
  >
<!--    <v-card-title class="text-subtitle-1 pa-0 mb-3">-->
<!--      Mission Control-->
<!--    </v-card-title>-->
<!--    <v-divider class="mb-3"></v-divider>-->

    <!--pause, rtl, land-->
    <div v-if="getControlstreamByRole('pause') || getControlstreamByRole('rtl') || getControlstreamByRole('land') || getControlstreamByRole('cancel')">
      <v-card-title class="text-subtitle-1 pa-0 mb-3">
        Commands
      </v-card-title>
      <v-row dense>
        <v-col cols="6" sm="3" v-if="getControlstreamByRole('pause')">
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
        <v-col cols="6" sm="3" v-if="getControlstreamByRole('rtl')">
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
        <v-col cols="6" sm="3" v-if="getControlstreamByRole('cancel')">
          <v-btn
              block
              variant="tonal"
              color="error"
              @click="cancel"
              class="command-btn"
          >
            <v-icon start>mdi-cancel</v-icon>
            Cancel
          </v-btn>
        </v-col>
        <v-col cols="6" sm="3" v-if="getControlstreamByRole('land')">
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
      </v-row>
    </div>

    <!--takeoff control-->
    <div v-if="getControlstreamByRole('takeoff')">
      <v-divider class="mb-4"></v-divider>
      <v-card-title class="text-subtitle-1 pa-0 mb-3">
        Takeoff Control
      </v-card-title>
      <v-row dense>
        <v-col cols="6" sm="4">
          <v-text-field
              v-model.number="takeOffAlt"
              type="number"
              label="Takeoff Altitude"
              density="compact"
              hide-details
          />
        </v-col>
        <v-col cols="6" sm="4">
          <v-btn
              block
              variant="tonal"
              color="primary"
              @click="takeoffCommand"
              class="command-btn"
          >
            <v-icon start>mdi-airplane</v-icon>
            Take Off
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <!--offboard control-->
    <div v-if="getControlstreamByRole('offboard')">
      <v-divider class="mb-4"></v-divider>
      <v-card-title class="text-subtitle-1 pa-0 mb-3">
        Offboard Control
      </v-card-title>
      <v-row dense align="center">
        <v-col cols="12" sm="">
          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="xVelocity"
                  type="number"
                  label="X Velocity"
                  density="compact"
                  hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="yVelocity"
                  type="number"
                  label="Y Velocity"
                  density="compact"
                  hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="zVelocity"
                  type="number"
                  label="Z Velocity"
                  density="compact"
                  hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="yawRate"
                  type="number"
                  label="Yaw Rate"
                  density="compact"
                  hide-details
              />
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" sm="auto">
          <v-btn
              block
              variant="tonal"
              color="primary"
              @click="offboard"
              class="command-btn"
          >
            Offboard
          </v-btn>
        </v-col>
      </v-row>
    </div>

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