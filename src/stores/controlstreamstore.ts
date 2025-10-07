import { defineStore } from 'pinia'

import { ref, Ref } from 'vue'
import { OSHControlStream } from '@/lib/OSHConnectDataStructs'

export const useControlStreamStore = defineStore('controlstreams', () => {
  const controlStreams: Ref<OSHControlStream[]> = ref([])

  const addControlStream = (controlStream: OSHControlStream): void => {
    controlStreams.value.push(controlStream)

    console.log('[ControlStreamStore] Added control stream:', controlStream);
  }

  const removeControlStream = (controlStream: OSHControlStream): void => {
    controlStreams.value = controlStreams.value.filter(ds => ds !== controlStream)
  }

  const getControlStreamByName = (name: string): OSHControlStream | undefined => {
    return controlStreams.value.find(controlStream => controlStream.name === name)
  }

  const checkIfControlStreamExists = (id: string): boolean => {
    return controlStreams.value.some(controlStream => controlStream.id === id)
  }

  const getControlStreamsById = (ids: string[]): OSHControlStream[] => {
    return controlStreams.value.filter(controlStream => ids.includes(controlStream.id))
  }

  return { controlStreams, addControlStream, removeControlStream, getControlStreamByName, checkIfControlStreamExists, getControlStreamsById }
})
