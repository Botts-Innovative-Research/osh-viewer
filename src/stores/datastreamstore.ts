import { defineStore } from 'pinia'

import { ref, Ref } from 'vue'
import { OSHDatastream } from '@/services/OSHConnectDataStructs'

export const useDataStreamStore = defineStore('datastreams', () => {
  const dataStreams: Ref<OSHDatastream[]> = ref([])

  const addDataStream = (dataStream: OSHDatastream): void => {
    dataStreams.value.push(dataStream)
  }

  const removeDataStream = (dataStream: OSHDatastream): void => {
    dataStreams.value = dataStreams.value.filter(ds => ds !== dataStream)
  }

  const getDataStreamByName = (name: string): OSHDatastream | undefined => {
    return dataStreams.value.find(dataStream => dataStream.name === name)
  }

  const checkIfDataStreamExists = (id: string): boolean => {
    return dataStreams.value.some(dataStream => dataStream.uuid === id)
  }

  const getDataStreamsById = (ids: string[]): OSHDatastream[] => {
    return dataStreams.value.filter(dataStream => ids.includes(dataStream.uuid))
  }

  return { dataStreams, addDataStream, removeDataStream, getDataStreamByName, checkIfDataStreamExists, getDataStreamsById }
})
