<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getMyListings } from '@/api/listings'
import { getListingLeads } from '@/api/contact'
import { useApiError } from '@/composables/useApiError'
import type { LeadWithListing } from '@/types'
import AppHeader from '@/components/AppHeader.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import LeadCard from '@/components/LeadCard.vue'

const apiError = useApiError()
const loading = ref(false)
const leads = ref<LeadWithListing[]>([])
// Set when some (but not all) per-listing fetches failed — the page still renders.
const partialError = ref<string | null>(null)

async function load(): Promise<void> {
  loading.value = true
  apiError.clear()
  partialError.value = null
  try {
    const mine = await getMyListings()

    // N+1 AGGREGATION: there is no bulk "all leads" endpoint yet, so we fetch
    // /contacts per listing and merge client-side. A future GET /api/leads
    // backend endpoint would replace this whole block with a single call.
    // Promise.allSettled so one failing listing doesn't sink the whole inbox.
    const settled = await Promise.allSettled(
      mine.map(async (listing) => {
        const listingLeads = await getListingLeads(listing.id)
        return listingLeads.map<LeadWithListing>((lead) => ({
          ...lead,
          listingId: listing.id,
          listingTitle: listing.title,
        }))
      }),
    )

    const merged: LeadWithListing[] = []
    let anyFailed = false
    for (const result of settled) {
      if (result.status === 'fulfilled') merged.push(...result.value)
      else anyFailed = true
    }

    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    leads.value = merged
    if (anyFailed) {
      partialError.value =
        'Some listings could not be loaded — showing the inquiries we could fetch.'
    }
  } catch (err) {
    // getMyListings itself failed → whole-page error.
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

    <main class="mx-auto max-w-3xl px-4 py-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Inquiries</h1>
          <p class="mt-1 text-sm text-gray-500">
            All buyer messages across your listings.
          </p>
        </div>
        <RouterLink
          :to="{ name: 'seller-listings' }"
          class="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          My listings →
        </RouterLink>
      </div>

      <AlertBanner
        v-if="apiError.message.value"
        variant="error"
        class="mb-4"
        :message="apiError.message.value"
      />
      <AlertBanner
        v-if="partialError"
        variant="info"
        class="mb-4"
        :message="partialError"
      />

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="n in 3"
          :key="n"
          class="h-24 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm"
        ></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="leads.length === 0 && !apiError.message.value"
        class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"
      >
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
          aria-hidden="true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-gray-900">No inquiries yet</h3>
        <p class="mx-auto mt-1 max-w-sm text-sm text-gray-500">
          No inquiries yet across your listings. They'll appear here when buyers
          reach out.
        </p>
      </div>

      <!-- Leads -->
      <div v-else class="space-y-3">
        <LeadCard
          v-for="lead in leads"
          :key="lead.id"
          :lead="lead"
          :listing-title="lead.listingTitle"
        />
      </div>
    </main>
  </div>
</template>
