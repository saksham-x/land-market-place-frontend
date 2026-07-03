import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiError, NormalizedApiError } from '@/types'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

/**
 * Raw axios instance. Prefer the typed `http` façade below for API calls so
 * you receive the unwrapped `data` payload directly and with proper types.
 *
 * Note: `useAuthStore` / `router` are imported at module top but only ever
 * referenced *inside* interceptor callbacks — by the time a request fires,
 * Pinia and the router are installed, so the (intentional) import cycle
 * between client ↔ store ↔ router resolves safely via ESM live bindings.
 */
export const client: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// --- Request interceptor: attach the bearer token from the auth store. ---
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.set('Authorization', `Bearer ${auth.token}`)
  }
  return config
})

// --- Response interceptor: unwrap the envelope + normalize errors. ---
client.interceptors.response.use(
  // On success, unwrap `{ success, message, data }` so callers get `data`.
  (response: AxiosResponse) => response.data?.data,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status
    const payload = error.response?.data

    // On 401, clear auth state and bounce to /login (preserving intended dest).
    if (status === 401) {
      const auth = useAuthStore()
      auth.logout()
      const current = router.currentRoute.value
      if (current.name !== 'login') {
        void router.push({
          name: 'login',
          query: { redirect: current.fullPath },
        })
      }
    }

    const normalized: NormalizedApiError = {
      message:
        payload?.message ||
        error.message ||
        'Something went wrong. Please try again.',
      error: payload?.error || error.code || 'UNKNOWN_ERROR',
      status,
      validationErrors: payload?.validationErrors,
    }
    return Promise.reject(normalized)
  },
)

/**
 * Typed façade over the axios instance. Because the response interceptor
 * already unwraps the envelope, each method resolves to the `data` payload
 * typed as `T`.
 */
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.get(url, config) as unknown as Promise<T>
  },
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.post(url, body, config) as unknown as Promise<T>
  },
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.put(url, body, config) as unknown as Promise<T>
  },
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.patch(url, body, config) as unknown as Promise<T>
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.delete(url, config) as unknown as Promise<T>
  },
}

export default client
