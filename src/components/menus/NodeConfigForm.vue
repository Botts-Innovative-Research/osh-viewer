<script setup>

import { ref } from 'vue'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'
import { useUIStore } from '@/stores/uistore'

const oshconnect = useOSHConnectStore().getInstance();
const uiStore = useUIStore();

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

  cancelForm();
}

const cancelForm = () => {
  uiStore.nodeConfigFormOpen = false;
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
  <v-card class="pa-2 ma-2" width="100%" height="100%" elevation="2">
    <v-card-title>Add a New Node</v-card-title>

    <v-card-text>
      <v-form ref="formRef" @submit.prevent="createNode">
        <v-text-field label="Node Name" v-model="nodeName" placeholder="Test" required />
        <v-text-field label="Node Host" v-model="nodeHost" placeholder="localhost" required />
        <v-text-field label="Node Port" v-model="nodePort" placeholder="8181" required />
        <v-text-field label="Node Path" v-model="nodeOshPath" placeholder="/sensorhub"/>
        <v-text-field label="Node Path" v-model="nodeApiPath" placeholder="/api"/>
        <v-text-field label="Node User" v-model="nodeUser" />
        <v-text-field label="Node Password" v-model="nodePassword" type="password" />
        <v-checkbox label="Enable TLS" v-model="tls"></v-checkbox>

        <!-- Buttons inside the form -->
        <v-card-actions>
          <v-btn type="submit" color="success">Create Node</v-btn>
          <v-btn text @click="cancelForm">Cancel</v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>


<style scoped></style>