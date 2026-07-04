/** Area units supported by the backend (Nepali land units + metric). */
export type AreaUnit =
  | 'sqm'
  | 'ropani'
  | 'aana'
  | 'paisa'
  | 'daam'
  | 'bigha'
  | 'kattha'
  | 'dhur'

/**
 * Public, browse-safe listing shape returned by the browse API.
 * Deliberately omits seller contact info, status, and sellerId.
 */
export interface BrowseListing {
  id: string
  title: string
  description: string
  price: number
  province: string
  district: string
  city: string
  /** Area in the seller's chosen unit (e.g. 5 for "5 ropani"). */
  areaValue: number
  areaUnit: AreaUnit
  /** Canonical area in square metres, for comparison/filtering. */
  areaSqm: number
  sellerName: string
  createdAt: string
}

/** Paginated response envelope payload from GET /api/browse. */
export interface BrowseResponse {
  items: BrowseListing[]
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Optional query filters for GET /api/browse (undefined = omit). */
export interface BrowseFilters {
  page?: number
  limit?: number
  province?: string
  district?: string
  city?: string
  priceMin?: number
  priceMax?: number
  areaMinSqm?: number
  areaMaxSqm?: number
  q?: string
}

// --- Owner-facing listing shapes (seller management) --------------------
// These are DISTINCT from the public BrowseListing above: the owner view
// exposes `status` and edit metadata, and never appears on the public API.

/** Lifecycle statuses for a seller's own listing. */
export type ListingStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'sold'
  | 'expired'

/** Full listing shape returned to its owner (includes status). */
export interface OwnerListing {
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
  updatedAt: string
}

/** Body for POST /api/listings. */
export interface CreateListingPayload {
  title: string
  description: string
  price: number
  province: string
  district: string
  city: string
  areaValue: number
  areaUnit: AreaUnit
}

/** Body for PATCH /api/listings/:id (draft only) — a partial of create. */
export type UpdateListingPayload = Partial<CreateListingPayload>

/** Payment record for a listing fee. */
export interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  provider: string
  transactionRef: string
  paidAt: string | null
  createdAt: string
}
