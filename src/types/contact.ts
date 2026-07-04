/**
 * Buyer-contact (inquiry / lead) shapes. Kept separate from listing types.
 */

/** Body for POST /api/listings/:listingId/contact. */
export interface SendInquiryPayload {
  message: string
}

/** Buyer context attached to a lead (nested form). */
export interface LeadBuyer {
  id?: string
  fullName?: string
  email?: string
}

/**
 * A single inquiry/lead on a listing, as seen by the seller-owner.
 *
 * Buyer context may arrive nested under `buyer` or as flat fields depending on
 * the backend serializer — both are modelled here and resolved via
 * `src/utils/contact.ts`. (Flag if the real field set differs.)
 */
export interface Lead {
  id: string
  listingId: string
  message: string
  createdAt: string
  buyer: LeadBuyer
  buyerName?: string
  buyerEmail?: string
}

/** A lead enriched with minimal listing context, for the combined inbox. */
export interface LeadWithListing extends Lead {
  listingTitle: string
}
