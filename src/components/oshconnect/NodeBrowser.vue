<script setup>
import { useNodeStore } from '@/stores/nodestore.ts'

const nodes = useNodeStore().nodes

</script>
<template>
  <v-treeview width="100%" :items="nodes" item-value="uuid" item-title="name" color="primary" activatable>
  </v-treeview>
</template>

<style scoped></style>