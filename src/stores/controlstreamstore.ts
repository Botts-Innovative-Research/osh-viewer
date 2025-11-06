import { defineStore } from 'pinia'

import { ref, Ref } from 'vue'
import { OSHControlStream } from '@/lib/OSHConnectDataStructs'

export const useControlStreamStore = defineStore('controlstreams', () => {
  const controlStreams: Ref<OSHControlStream[]> = ref([])
  const schemas: Ref<Record<string, any>> = ref({})

  /* Control Stream management */
  const addControlStream = (controlStream: OSHControlStream): void => {
    controlStreams.value.push(controlStream)

    console.log('[ControlStreamStore] Added control stream:', controlStream)
  }

  const removeControlStream = (controlStream: OSHControlStream): void => {
    controlStreams.value = controlStreams.value.filter((ds) => ds !== controlStream)
  }

  const getControlStreamByName = (name: string): OSHControlStream | undefined => {
    return controlStreams.value.find((controlStream) => controlStream.name === name)
  }

  const checkIfControlStreamExists = (id: string): boolean => {
    return controlStreams.value.some((controlStream) => controlStream.id === id)
  }

  const getControlStreamsById = (ids: string[]): OSHControlStream[] => {
    return controlStreams.value.filter((controlStream) => ids.includes(controlStream.id))
  }

  /* Schema management */
  const addCSSchema = (id: string, type: any, schema: any): void => {
    schemas.value[id] = { type, schema }
    console.log('[ControlStreamStore] Added control stream schema:', id, schemas.value[id])
  }

  const getCSSchemaById = (id: string): any | undefined => {
    console.log('[ControlStreamStore] Getting control stream schema for id:', schemas.value[id]?.schema);
    return schemas.value[id]?.schema
  }

  const getCSTypeById = (id: string): any | undefined => {
    return schemas.value[id]?.type
  }


  return {
    controlStreams,
    addControlStream,
    removeControlStream,
    getControlStreamByName,
    checkIfControlStreamExists,
    getControlStreamsById,
    schemas,
    addCSSchema,
    getCSSchemaById,
    getCSTypeById
  }
})
