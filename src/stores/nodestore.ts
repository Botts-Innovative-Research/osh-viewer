import { defineStore } from 'pinia'
import { ref, Ref } from 'vue'
import { OSHNode } from '@/lib/OSHConnectDataStructs'
import { showToast } from '@/composables/useToast'

export const useNodeStore = defineStore('nodes', () => {
  const nodes: Ref<OSHNode[]> = ref([])

  const addNode = (node: OSHNode): any => {
    if (checkIfNodeExists(node.name) || node.name === undefined) {
      console.log('Node already exists or name is undefined', node)
      showToast('Node already exists or name is undefined', 'ERROR')
      return
    }
    nodes.value.push(node)
    showToast('Node created successfully', 'SUCCESS')
  }

  const removeNode = (node: OSHNode): void => {
    nodes.value = nodes.value.filter((n) => n !== node)
  }

  const getNodeByName = (name: string): OSHNode | undefined => {
    return nodes.value.find((node) => node.name === name)
  }

  const checkIfNodeExists = (name: string): boolean => {
    return nodes.value.some((node) => node.name === name)
  }

  return { nodes, addNode, removeNode, getNodeByName, checkIfNodeExists }
})
