import type { AreaUnit } from '@/types'

const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const sqmFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

/** Format a price in NPR, e.g. `Rs 25,000,000`. */
export function formatNpr(price: number): string {
  if (!Number.isFinite(price)) return '—'
  return `Rs ${priceFormatter.format(price)}`
}

/** Format an area in the seller's original unit, e.g. `5 ropani`. */
export function formatArea(value: number, unit: AreaUnit): string {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2))
  return `${rounded} ${unit}`
}

/** Format square metres, e.g. `2,543.6 m²`. */
export function formatSqm(sqm: number): string {
  if (!Number.isFinite(sqm)) return '—'
  return `${sqmFormatter.format(sqm)} m²`
}

/**
 * Full area string showing both the original unit and sqm,
 * e.g. `5 ropani (2,543.6 m²)`.
 */
export function formatAreaFull(
  value: number,
  unit: AreaUnit,
  sqm: number,
): string {
  // When the seller already listed in sqm, avoid the redundant "(… m²)".
  if (unit === 'sqm') return formatSqm(sqm)
  return `${formatArea(value, unit)} (${formatSqm(sqm)})`
}

/** Format an ISO date string, e.g. `Jul 4, 2026`. */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}
