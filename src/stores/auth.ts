import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { AuthData, LoginPayload, RegisterPayload, Role, User } from '@/types'

/** localStorage key under which the JWT is persisted between sessions. */
const TOKEN_STORAGE_KEY = 'lm_auth_token'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<User | null>(null)
  // Rehydrate the token synchronously on store creation (app load).
  const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value)
  const role = computed<Role | null>(() => user.value?.role ?? null)

  // --- Internal helpers ---
  function setSession(data: AuthData): void {
    user.value = data.user
    token.value = data.token
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
  }

  // --- Actions ---
  async function login(payload: LoginPayload): Promise<User> {
    const data = await authApi.login(payload)
    setSession(data)
    return data.user
  }

  async function register(payload: RegisterPayload): Promise<User> {
    const data = await authApi.register(payload)
    setSession(data)
    return data.user
  }

  /**
   * Fetch the current user's profile using the persisted token.
   * Used on app load to rehydrate `user` when only the token survived a reload.
   */
  async function fetchMe(): Promise<User | null> {
    if (!token.value) return null
    const me = await authApi.getMe()
    user.value = me
    return me
  }

  function logout(): void {
    user.value = null
    token.value = null
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  return {
    // state
    user,
    token,
    // getters
    isAuthenticated,
    role,
    // actions
    login,
    register,
    fetchMe,
    logout,
  }
})
