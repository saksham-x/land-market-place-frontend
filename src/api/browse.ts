import { http } from './client'
import type { BrowseFilters, BrowseListing, BrowseResponse } from '@/types'

/**
 * GET /api/browse — public, paginated listing search.
 * Only defined, non-empty filters are sent as query params.
 */
export function browseListings(
  filters: BrowseFilters = {},
): Promise<BrowseResponse> {
  const params = new URLSearchParams()

  const add = (key: string, value: string | number | undefined | null): void => {
    if (value === undefined || value === null) return
    const str = String(value).trim()
    if (str === '') return
    params.set(key, str)
  }

  add('page', filters.page)
  add('limit', filters.limit)
  add('province', filters.province)
  add('district', filters.district)
  add('city', filters.city)
  add('priceMin', filters.priceMin)
  add('priceMax', filters.priceMax)
  add('areaMinSqm', filters.areaMinSqm)
  add('areaMaxSqm', filters.areaMaxSqm)
  add('q', filters.q)

  const qs = params.toString()
  return http.get<BrowseResponse>(`/api/browse${qs ? `?${qs}` : ''}`)
}

/**
 * GET /api/browse/:id — a single verified public listing.
 * Rejects with a NormalizedApiError (status 404) if not found/not verified.
 */
export function getListing(id: string): Promise<BrowseListing> {
  return http.get<BrowseListing>(`/api/browse/${encodeURIComponent(id)}`)
}
