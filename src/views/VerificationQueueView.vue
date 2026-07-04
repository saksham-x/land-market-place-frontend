<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getPendingListings } from '@/api/verification'
import { useApiError } from '@/composables/useApiError'
import type { PendingListing } from '@/types'
import { formatNpr, formatArea, formatDate } from '@/utils/format'
import { sellerName, sellerEmail } from '@/utils/verification'
import AppHeader from '@/components/AppHeader.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const apiError = useApiError()
const loading = ref(false)
const listings = ref<PendingListing[]>([])

async function load(): Promise<void> {
  loading.value = true
  apiError.clear()
  try {
    // NOTE: this endpoint is not paginated yet (known backend open item) — we
    // render the full queue for now. Pagination is a future enhancement.
    listings.value = await getPendingListings()
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
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Verification queue</h1>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="!loading && !apiError.message.value">
            {{ listings.length }}
            {{ listings.length === 1 ? 'listing' : 'listings' }} awaiting review
          </template>
          <template v-else>Review and approve or reject submitted listings.</template>
        </p>
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
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600"
          aria-hidden="true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-gray-900">All caught up</h3>
        <p class="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          No listings awaiting verification.
        </p>
      </div>

      <!-- Queue -->
      <ul v-else class="space-y-3">
        <li v-for="item in listings" :key="item.id">
          <RouterLink
            :to="{ name: 'admin-verification-review', params: { listingId: item.id } }"
            class="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <div class="min-w-0">
              <h3 class="truncate font-semibold text-gray-900">
                {{ item.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ item.city }}, {{ item.district }} ·
                {{ formatArea(item.areaValue, item.areaUnit) }}
              </p>
              <p class="mt-1 text-xs text-gray-400">
                {{ sellerName(item)
                }}<template v-if="sellerEmail(item)">
                  · {{ sellerEmail(item) }}</template
                >
                · submitted {{ formatDate(item.createdAt) }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-bold text-brand-700">{{ formatNpr(item.price) }}</p>
              <p class="mt-1 text-xs font-medium text-blue-600">Review →</p>
            </div>
          </RouterLink>
        </li>
      </ul>
    </main>
  </div>
</template>
