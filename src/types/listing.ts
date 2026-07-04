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
