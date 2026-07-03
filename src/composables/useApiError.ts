import { ref, computed } from 'vue'
import type { NormalizedApiError, ValidationError } from '@/types'

/** Type guard for the normalized error shape rejected by the axios client. */
export function isNormalizedApiError(e: unknown): e is NormalizedApiError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    'error' in e &&
    typeof (e as NormalizedApiError).message === 'string'
  )
}

/** Build a `{ path -> message }` map from the backend's validationErrors. */
function toFieldErrors(validationErrors?: ValidationError[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const v of validationErrors ?? []) {
    // Keep the first message per field for a clean single-line inline error.
    if (!(v.path in map)) map[v.path] = v.message
  }
  return map
}

/**
 * Form-friendly error handling. Feed it a caught API error and it exposes a
 * top-level `message` plus a `fieldErrors` map so forms can render both a
 * banner and inline, per-field messages.
 */
export function useApiError() {
  const message = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})

  const hasError = computed(
    () => message.value !== null || Object.keys(fieldErrors.value).length > 0,
  )

  /** Normalize any caught value into a display message + field-errors map. */
  function setError(err: unknown): void {
    if (isNormalizedApiError(err)) {
      message.value = err.message
      fieldErrors.value = toFieldErrors(err.validationErrors)
    } else if (err instanceof Error) {
      message.value = err.message
      fieldErrors.value = {}
    } else {
      message.value = 'Something went wrong. Please try again.'
      fieldErrors.value = {}
    }
  }

  /** Look up the inline error for a single field, if any. */
  function fieldError(path: string): string | undefined {
    return fieldErrors.value[path]
  }

  /** Clear a single field's error (e.g. as the user edits it). */
  function clearField(path: string): void {
    if (path in fieldErrors.value) {
      const next = { ...fieldErrors.value }
      delete next[path]
      fieldErrors.value = next
    }
  }

  /** Reset all error state. */
  function clear(): void {
    message.value = null
    fieldErrors.value = {}
  }

  return {
    message,
    fieldErrors,
    hasError,
    setError,
    fieldError,
    clearField,
    clear,
  }
}
