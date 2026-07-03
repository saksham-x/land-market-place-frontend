import type { SelfRegisterRole } from './user'
import type { User } from './user'

/** Payload for POST /api/auth/register. */
export interface RegisterPayload {
  email: string
  password: string
  role: SelfRegisterRole
  fullName: string
}

/** Payload for POST /api/auth/login. */
export interface LoginPayload {
  email: string
  password: string
}

/**
 * `data` payload returned by both register and login:
 * the authenticated user plus a JWT token.
 */
export interface AuthData {
  user: User
  token: string
}
