import { http } from './client'
import type { Lead, SendInquiryPayload } from '@/types'

/**
 * POST /api/listings/:listingId/contact — send an inquiry (auth required).
 * Backend rules enforced server-side: message min 10 chars; can't inquire on
 * your own listing (400) or a non-verified listing (400/404). The response
 * body isn't consumed by the UI.
 */
export function sendInquiry(listingId: string, message: string): Promise<void> {
  const body: SendInquiryPayload = { message }
  return http.post<void>(
    `/api/listings/${encodeURIComponent(listingId)}/contact`,
    body,
  )
}

/**
 * GET /api/listings/:listingId/contacts — leads for a listing (seller-owner
 * only; 403 otherwise).
 */
export function getListingLeads(listingId: string): Promise<Lead[]> {
  return http.get<Lead[]>(
    `/api/listings/${encodeURIComponent(listingId)}/contacts`,
  )
}
