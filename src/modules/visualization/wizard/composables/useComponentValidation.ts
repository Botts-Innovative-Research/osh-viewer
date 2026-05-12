import { Ref, watch } from "vue";

/**
 * Defines validation logic for visualization form components and emits validation status to parent component
 * @param valid 
 * @param emit 
 */
export function useComponentValidation(valid: Ref<boolean>, emit: (event: "update:valid", value: boolean) => void) {
  watch(
    valid, v => emit('update:valid', v),
    { immediate: true,}
  )
}