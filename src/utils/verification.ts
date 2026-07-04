import type { PendingListing } from '@/types'

/**
 * Resolve a display name for the seller of a pending listing, tolerating either
 * the nested (`seller`) or flat (`sellerName`) shape the backend may return.
 */
export function sellerName(item: PendingListing): string {
  return (
    item.seller?.fullName ||
    item.sellerName ||
    item.seller?.email ||
    item.sellerEmail ||
    'Unknown seller'
  )
}

/** Resolve the seller's email, if available. */
export function sellerEmail(item: PendingListing): string | undefined {
  return item.seller?.email || item.sellerEmail
}
