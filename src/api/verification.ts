import { http } from './client'
import type { PendingListing, VerificationRecord } from '@/types'

/**
 * Admin verification API. All endpoints require an admin bearer token — the
 * backend enforces requireRole('admin'); the frontend gate is convenience only.
 */

/** GET /api/admin/verifications/pending — listings awaiting review (+ seller context). */
export function getPendingListings(): Promise<PendingListing[]> {
  return http.get<PendingListing[]>('/api/admin/verifications/pending')
}

/** POST /api/admin/verifications/:listingId/approve — approve → 'verified'. */
export function approveListing(listingId: string): Promise<void> {
  // Response body isn't consumed by the UI; callers refetch the queue.
  return http.post<void>(
    `/api/admin/verifications/${encodeURIComponent(listingId)}/approve`,
  )
}

/** POST /api/admin/verifications/:listingId/reject — reject with a reason (min 5) → 'draft'. */
export function rejectListing(
  listingId: string,
  reason: string,
): Promise<void> {
  return http.post<void>(
    `/api/admin/verifications/${encodeURIComponent(listingId)}/reject`,
    { reason },
  )
}

/** GET /api/admin/verifications/:listingId/history — audit records, newest first. */
export function getVerificationHistory(
  listingId: string,
): Promise<VerificationRecord[]> {
  return http.get<VerificationRecord[]>(
    `/api/admin/verifications/${encodeURIComponent(listingId)}/history`,
  )
}
