/** Shared client-side validators that mirror the backend's rules. */

/** Pragmatic email pattern (mirrors typical backend email validation). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Minimum password length enforced by the backend. */
export const PASSWORD_MIN_LENGTH = 8

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH
}
