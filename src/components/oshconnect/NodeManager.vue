<script setup>

/**
 * TODO: DEPRECATED -> Now in NodeConfigForm.vue
 */

import { ref } from 'vue'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'

const oshconnect = useOSHConnectStore().getInstance();

// Define reactive variables for the form fields
const nodeName = ref('Test')
const nodeHost = ref('localhost')
const nodePort = ref('8282')
const nodeOshPath = ref('/sensorhub')
const nodeApiPath = ref('/api')
const nodeUser = ref('admin')
const nodePassword = ref('admin')
const tls = ref(false)

const createNode = () => {
  // This function will be called when the button is clicked
  oshconnect.createNode(
      nodeName.value,
      nodeHost.value,
      nodePort.value,
      nodeOshPath.value,
      nodeApiPath.value,
      nodeUser.value,
      nodePassword.value,
      tls.value,
      this
  )
}

function sanitizeAPIRoot(path) {
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  if (path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}
</script>

<template>
  <v-form width="100%" height="100%" class="pa-2 ma-2" elevation="2">
    <v-text-field label="Node Name" v-model="nodeName" placeholder="Test"/>
    <v-text-field label="Node Host" v-model="nodeHost" placeholder="localhost"/>
    <v-text-field label="Node Port" v-model="nodePort" placeholder="8181"/>
    <v-text-field label="Node OSH Path" v-model="nodeOshPath" placeholder="/sensorhub"/>
    <v-text-field label="Node API Path" v-model="nodeApiPath" placeholder="/api"/>
    <v-text-field label="Node User" v-model="nodeUser" />
    <v-text-field label="Node Password" v-model="nodePassword" type="password" />
    <v-checkbox label="Enable TLS" v-model="tls"></v-checkbox>

    <v-btn @click="createNode">Create Node</v-btn>
  </v-form>
</template>

<style scoped>

</style>