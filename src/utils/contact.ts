import type { Lead } from '@/types'

/**
 * Resolve a display name for the buyer behind a lead, tolerating either the
 * nested (`buyer`) or flat (`buyerName`) shape the backend may return.
 */
export function buyerName(lead: Lead): string {
  return (
    lead.buyer?.fullName ||
    lead.buyerName ||
    lead.buyer?.email ||
    lead.buyerEmail ||
    'Unknown buyer'
  )
}

/** Resolve the buyer's email, if available. */
export function buyerEmail(lead: Lead): string | undefined {
  return lead.buyer?.email || lead.buyerEmail
}
