/** User roles supported by the backend. */
export type Role = 'seller' | 'buyer' | 'admin'

/** Roles a user is allowed to self-register with in the UI (never `admin`). */
export type SelfRegisterRole = Exclude<Role, 'admin'>

/**
 * Public user shape returned by the backend
 * (e.g. GET /api/users/me, and inside auth responses).
 */
export interface User {
  id: string
  email: string
  role: Role
  fullName?: string
  phone?: string
  avatarUrl?: string
  bio?: string
  address?: string
  createdAt: string
  updatedAt: string
}
