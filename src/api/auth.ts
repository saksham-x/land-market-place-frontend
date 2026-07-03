import { http } from './client'
import type { AuthData, LoginPayload, RegisterPayload, User } from '@/types'

/** POST /api/auth/register — creates an account and returns { user, token }. */
export function register(payload: RegisterPayload): Promise<AuthData> {
  return http.post<AuthData>('/api/auth/register', payload)
}

/** POST /api/auth/login — authenticates and returns { user, token }. */
export function login(payload: LoginPayload): Promise<AuthData> {
  return http.post<AuthData>('/api/auth/login', payload)
}

/** GET /api/users/me — returns the current authenticated user's profile. */
export function getMe(): Promise<User> {
  return http.get<User>('/api/users/me')
}
