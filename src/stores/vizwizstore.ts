import { defineStore } from 'pinia'

import { ref, Ref } from 'vue'

export const useVizWizStore = defineStore('vizwiz', () => {
  const visualizationType = ref<string>('')
  const systems = ref<string[]>([])
  const datastreams = ref<string[]>([])
  const config = ref<Record<string, any>>({})
  const customization = ref<Record<string, any>>({})

  const setType = (type: string): void => {
    visualizationType.value = type
    console.log('[VizWizStore] Set type:', type)
  }

  const setSystems = (val: string[]): void => {
    systems.value = val
    console.log('[VizWizStore] Set systems:', val)
  }

  const setDatastreams = (val: string[]): void => {
    datastreams.value = val
    console.log('[VizWizStore] Set datastreams:', val)
  }

  const setConfig = (val: Record<string, any>) => {
    config.value = val
    console.log('[VizWizStore] Set config:', val)
  }

  const setCustomization = (val: Record<string, any>) => {
    customization.value = val
    console.log('[VizWizStore] Set customization:', val)
  }

  // RESET STORE STATE
  const reset = () => {
    visualizationType.value = ''
    systems.value = []
    datastreams.value = []
    config.value = {}
    customization.value = {}

    console.log('[VizWizStore] Store reset')
  }

  return {
    visualizationType,
    systems,
    datastreams,
    config,
    customization,
    setType,
    setSystems,
    setDatastreams,
    setConfig,
    setCustomization,
    reset,
  }
})
