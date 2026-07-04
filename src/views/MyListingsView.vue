<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getMyListings } from '@/api/listings'
import { useApiError } from '@/composables/useApiError'
import type { OwnerListing } from '@/types'
import { formatNpr, formatArea } from '@/utils/format'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const apiError = useApiError()
const loading = ref(false)
const listings = ref<OwnerListing[]>([])

async function load(): Promise<void> {
  loading.value = true
  apiError.clear()
  try {
    listings.value = await getMyListings()
  } catch (err) {
    apiError.setError(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-full bg-gray-50">
    <AppHeader />

    <main class="mx-auto max-w-5xl px-4 py-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My listings</h1>
          <p class="mt-1 text-sm text-gray-500">
            Create, submit, and track your properties.
          </p>
        </div>
        <RouterLink :to="{ name: 'seller-listing-new' }">
          <BaseButton>+ Create new listing</BaseButton>
        </RouterLink>
      </div>

      <AlertBanner
        v-if="apiError.message.value"
        variant="error"
        class="mb-4"
        :message="apiError.message.value"
      />

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="n in 3"
          :key="n"
          class="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm"
        ></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="listings.length === 0 && !apiError.message.value"
        class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"
      >
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
          aria-hidden="true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 21l6-6 4 4 8-8M3 21h18" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-gray-900">
          You haven't listed any properties yet
        </h3>
        <p class="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          Create your first listing to start selling.
        </p>
        <div class="mt-4">
          <RouterLink :to="{ name: 'seller-listing-new' }">
            <BaseButton>Create your first listing</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- List -->
      <ul v-else class="space-y-3">
        <li v-for="listing in listings" :key="listing.id">
          <RouterLink
            :to="{ name: 'seller-listing-manage', params: { id: listing.id } }"
            class="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="truncate font-semibold text-gray-900">
                  {{ listing.title }}
                </h3>
                <StatusBadge :status="listing.status" />
              </div>
              <p class="mt-1 text-sm text-gray-500">
                {{ listing.city }}, {{ listing.district }} ·
                {{ formatArea(listing.areaValue, listing.areaUnit) }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-bold text-brand-700">
                {{ formatNpr(listing.price) }}
              </p>
              <p class="mt-1 text-xs text-gray-400">Manage →</p>
            </div>
          </RouterLink>
        </li>
      </ul>
    </main>
  </div>
</template>
