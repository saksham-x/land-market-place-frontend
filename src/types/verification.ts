import type { AreaUnit, ListingStatus } from './listing'

/**
 * Admin/verification shapes. Kept SEPARATE from OwnerListing and BrowseListing:
 * the admin queue carries the listing fields PLUS seller context so a reviewer
 * knows who submitted it.
 */

/** Seller context attached to a pending listing (nested form). */
export interface PendingListingSeller {
  id: string
  email: string
  fullName?: string
}

/**
 * A listing awaiting verification, as returned by the admin pending queue.
 *
 * Seller context may arrive nested under `seller` or as flat fields depending
 * on the backend serializer — both are modelled here and resolved via
 * `src/utils/verification.ts`. (Flag if the real field set differs.)
 */
export interface PendingListing {
  id: string
  title: string
  description: string
  price: number
  province: string
  district: string
  city: string
  areaValue: number
  areaUnit: AreaUnit
  areaSqm: number
  status: ListingStatus
  createdAt: string
  seller?: PendingListingSeller
  sellerName?: string
  sellerEmail?: string
}

/** Verification decision outcomes. */
export type VerificationDecision = 'approved' | 'rejected'

/** A single audit record of a verification decision on a listing. */
export interface VerificationRecord {
  id: string
  listingId: string
  adminId: string
  decision: VerificationDecision
  reason?: string
  reviewedAt: string
}
