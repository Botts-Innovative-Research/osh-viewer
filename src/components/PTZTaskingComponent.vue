<script setup lang="ts">
import PanTiltControl from './PanTiltControl.vue';

// Take in the control stream ID as a prop
const props = defineProps<{ commandBaseUrl: string, controlStreamId: string }>();

function sendCommand(command: any) {
  console.log(`Sending command to ${props.commandBaseUrl}/controlstreams/${props.controlStreamId}/commands: `, command);

  // Command sending logic
  fetch(`${props.commandBaseUrl}/controlstreams/${props.controlStreamId}/commands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  }).then(response => {
    if (!response.ok) {
      throw new Error('API call failed: ' + response.statusText);
    }
    return response.json();
  }).then(data => {
    console.log('Camera pan/tilt successful: ', data);
  }).catch(error => {
    console.error('Error sending command: ', error);
  })
}

</script>

<template>
  <PanTiltControl :onSend="sendCommand" :id="props.controlStreamId" />
</template>

<style scoped></style>