import { useToast, TYPE } from 'vue-toastification'

const toast = useToast()

export function showToast(message: string, type: keyof typeof TYPE = 'DEFAULT') {
  toast(message, { type: TYPE[type] })
}
