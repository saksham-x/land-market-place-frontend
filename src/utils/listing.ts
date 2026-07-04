import type { AreaUnit, ListingStatus } from '@/types'

/** Selectable area units with human-readable labels (for the form select). */
export const AREA_UNIT_OPTIONS: { value: AreaUnit; label: string }[] = [
  { value: 'ropani', label: 'Ropani' },
  { value: 'aana', label: 'Aana' },
  { value: 'paisa', label: 'Paisa' },
  { value: 'daam', label: 'Daam' },
  { value: 'bigha', label: 'Bigha' },
  { value: 'kattha', label: 'Kattha' },
  { value: 'dhur', label: 'Dhur' },
  { value: 'sqm', label: 'Square metres (m²)' },
]

/** Presentation metadata for each listing status. */
export interface StatusMeta {
  label: string
  /** Tailwind classes for a pill badge (bg + text). */
  badge: string
  /** One-line explanation shown on the manage page. */
  description: string
}

export const STATUS_META: Record<ListingStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    badge: 'bg-gray-100 text-gray-700',
    description: 'Not submitted yet. Edit the details, then submit for review.',
  },
  pending_payment: {
    label: 'Pending payment',
    badge: 'bg-amber-100 text-amber-800',
    description: 'Pay the one-time listing fee to send this for verification.',
  },
  pending_verification: {
    label: 'Under review',
    badge: 'bg-blue-100 text-blue-700',
    description: 'An admin is reviewing your listing. No action needed right now.',
  },
  verified: {
    label: 'Live',
    badge: 'bg-brand-100 text-brand-700',
    description: 'Your listing is public and visible to buyers.',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-red-100 text-red-700',
    description: 'This listing was rejected. Update the details and resubmit.',
  },
  sold: {
    label: 'Sold',
    badge: 'bg-slate-200 text-slate-700',
    description: 'This listing is marked as sold. It is now read-only.',
  },
  expired: {
    label: 'Expired',
    badge: 'bg-orange-100 text-orange-700',
    description: 'This listing expired. Relist it to make it live again.',
  },
}

export function statusMeta(status: ListingStatus): StatusMeta {
  return STATUS_META[status]
}
