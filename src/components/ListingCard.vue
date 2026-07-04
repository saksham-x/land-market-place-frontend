<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { BrowseListing } from '@/types'
import { formatNpr, formatArea } from '@/utils/format'

defineProps<{ listing: BrowseListing }>()
</script>

<template>
  <RouterLink
    :to="{ name: 'listing-detail', params: { id: listing.id } }"
    class="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
  >
    <!-- Placeholder media band (no images in the public shape yet). -->
    <div
      class="flex h-28 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600"
      aria-hidden="true"
    >
      <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 21l6-6 4 4 8-8M3 21h18" />
      </svg>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold text-gray-900 line-clamp-1 group-hover:text-brand-700">
          {{ listing.title }}
        </h3>
      </div>

      <p class="mt-1 text-lg font-bold text-brand-700">
        {{ formatNpr(listing.price) }}
      </p>

      <p class="mt-1 text-sm text-gray-500">
        {{ listing.city }}, {{ listing.district }}
      </p>

      <p class="mt-2 text-sm text-gray-600 line-clamp-2">
        {{ listing.description }}
      </p>

      <div
        class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500"
      >
        <span class="font-medium text-gray-700">
          {{ formatArea(listing.areaValue, listing.areaUnit) }}
        </span>
        <span class="truncate">{{ listing.sellerName }}</span>
      </div>
    </div>
  </RouterLink>
</template>
