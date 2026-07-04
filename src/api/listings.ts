import { http } from './client'
import type {
  CreateListingPayload,
  OwnerListing,
  Payment,
  UpdateListingPayload,
} from '@/types'

const base = (id: string) => `/api/listings/${encodeURIComponent(id)}`

/** POST /api/listings — create a new listing (starts as 'draft'). */
export function createListing(
  payload: CreateListingPayload,
): Promise<OwnerListing> {
  return http.post<OwnerListing>('/api/listings', payload)
}

/** GET /api/listings/mine — the current seller's own listings. */
export function getMyListings(): Promise<OwnerListing[]> {
  return http.get<OwnerListing[]>('/api/listings/mine')
}

/** GET /api/listings/:id — one own listing (403 if not the owner). */
export function getListing(id: string): Promise<OwnerListing> {
  return http.get<OwnerListing>(base(id))
}

/** PATCH /api/listings/:id — edit a DRAFT listing (400 if not draft). */
export function updateListing(
  id: string,
  payload: UpdateListingPayload,
): Promise<OwnerListing> {
  return http.patch<OwnerListing>(base(id), payload)
}

/** POST /api/listings/:id/submit — draft → pending_payment (or → pending_verification if already paid). */
export function submitListing(id: string): Promise<OwnerListing> {
  return http.post<OwnerListing>(`${base(id)}/submit`)
}

/** DELETE /api/listings/:id — delete an own listing. */
export function deleteListing(id: string): Promise<void> {
  return http.delete<void>(base(id))
}

/** POST /api/listings/:id/sold — verified → sold. */
export function markSold(id: string): Promise<OwnerListing> {
  return http.post<OwnerListing>(`${base(id)}/sold`)
}

/** POST /api/listings/:id/relist — expired → pending_verification (no re-pay). */
export function relistListing(id: string): Promise<OwnerListing> {
  return http.post<OwnerListing>(`${base(id)}/relist`)
}

/** POST /api/listings/:listingId/pay — pay the (dummy) listing fee → pending_verification. */
export function payListing(listingId: string): Promise<Payment> {
  return http.post<Payment>(`${base(listingId)}/pay`)
}

/** GET /api/listings/:listingId/payment — fetch the payment record. */
export function getPayment(listingId: string): Promise<Payment> {
  return http.get<Payment>(`${base(listingId)}/payment`)
}
