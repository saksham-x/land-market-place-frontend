/**
 * Shared response envelope types that mirror the backend's public shapes.
 *
 * Every backend endpoint responds with one of these two envelopes:
 *   success: { success: true,  message, data }
 *   error:   { success: false, message, error, validationErrors? }
 */

/** A single field-level validation error returned by the backend. */
export interface ValidationError {
  path: string
  message: string
}

/** Successful response envelope wrapping a typed `data` payload. */
export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

/** Error response envelope. */
export interface ApiError {
  success: false
  message: string
  error: string
  validationErrors?: ValidationError[]
}

/** Either side of the envelope, discriminated on `success`. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError

/**
 * Normalized error thrown by the axios client after unwrapping the envelope,
 * so callers/composables always receive a predictable shape regardless of
 * whether the failure came from the network, a non-2xx response, etc.
 */
export interface NormalizedApiError {
  /** Human-friendly message suitable for display. */
  message: string
  /** Machine-readable error code/string from the backend (if any). */
  error: string
  /** HTTP status code, when the request reached the server. */
  status?: number
  /** Field-level validation errors, when present. */
  validationErrors?: ValidationError[]
}
