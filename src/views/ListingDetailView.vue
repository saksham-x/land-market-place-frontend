<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getListing } from '@/api/browse'
import { useApiError, isNormalizedApiError } from '@/composables/useApiError'
import type { BrowseListing } from '@/types'
import { formatNpr, formatAreaFull, formatDate } from '@/utils/format'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import ContactSellerForm from '@/components/ContactSellerForm.vue'

const route = useRoute()
const apiError = useApiError()

const loading = ref(false)
const notFound = ref(false)
const listing = ref<BrowseListing | null>(null)

async function load(id: string): Promise<void> {
  loading.value = true
  notFound.value = false
  apiError.clear()
  listing.value = null
  try {
    listing.value = await getListing(id)
  } catch (err) {
    // A 404 means "not found or not verified" — show a dedicated state
    // rather than a generic error banner.
    if (isNormalizedApiError(err) && err.status === 404) {
      notFound.value = true
    } else {
      apiError.setError(err)
    }
  } finally {
    loading.value = false
  }
}

// Reload if the id param changes (e.g. navigating between listings).
watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string' && id) void load(id)
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-full bg-gray-50">
    <AppHeader />

    <main class="mx-auto max-w-4xl px-4 py-8">
      <RouterLink
        :to="{ name: 'browse' }"
        class="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        ← Back to browse
      </RouterLink>

      <!-- Loading -->
      <div
        v-if="loading"
        class="animate-pulse space-y-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
      >
        <div class="h-6 w-2/3 rounded bg-gray-100"></div>
        <div class="h-8 w-1/3 rounded bg-gray-100"></div>
        <div class="h-4 w-1/2 rounded bg-gray-100"></div>
        <div class="h-24 w-full rounded bg-gray-100"></div>
      </div>

      <!-- Not found / not verified (404) -->
      <div
        v-else-if="notFound"
        class="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm"
      >
        <h1 class="text-xl font-bold text-gray-900">Listing not found</h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
          This listing doesn't exist, or it isn't available for public viewing.
        </p>
        <div class="mt-6">
          <RouterLink :to="{ name: 'browse' }">
            <BaseButton>Browse other listings</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- Generic error -->
      <AlertBanner
        v-else-if="apiError.message.value"
        variant="error"
        :message="apiError.message.value"
      />

      <!-- Loaded listing -->
      <article
        v-else-if="listing"
        class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div
          class="flex h-40 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600"
          aria-hidden="true"
        >
          <svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 21l6-6 4 4 8-8M3 21h18" />
          </svg>
        </div>

        <div class="p-6 sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ listing.title }}
              </h1>
              <p class="mt-1 text-sm text-gray-500">
                {{ listing.city }}, {{ listing.district }},
                {{ listing.province }}
              </p>
            </div>
            <p class="text-3xl font-bold text-brand-700">
              {{ formatNpr(listing.price) }}
            </p>
          </div>

          <!-- Key facts -->
          <dl class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Area
              </dt>
              <dd class="mt-1 text-sm font-semibold text-gray-900">
                {{ formatAreaFull(listing.areaValue, listing.areaUnit, listing.areaSqm) }}
              </dd>
            </div>
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Listed by
              </dt>
              <dd class="mt-1 text-sm font-semibold text-gray-900">
                {{ listing.sellerName }}
              </dd>
            </div>
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Posted
              </dt>
              <dd class="mt-1 text-sm font-semibold text-gray-900">
                {{ formatDate(listing.createdAt) }}
              </dd>
            </div>
          </dl>

          <!-- Description -->
          <section class="mt-8">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h2>
            <p class="mt-2 whitespace-pre-line leading-relaxed text-gray-700">
              {{ listing.description }}
            </p>
          </section>

          <!-- Location detail -->
          <section class="mt-8">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Location
            </h2>
            <dl class="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-gray-400">Province</dt>
                <dd class="font-medium text-gray-900">{{ listing.province }}</dd>
              </div>
              <div>
                <dt class="text-gray-400">District</dt>
                <dd class="font-medium text-gray-900">{{ listing.district }}</dd>
              </div>
              <div>
                <dt class="text-gray-400">City</dt>
                <dd class="font-medium text-gray-900">{{ listing.city }}</dd>
              </div>
            </dl>
          </section>

          <!-- Contact seller — real inquiry flow -->
          <div class="mt-8 border-t border-gray-100 pt-6">
            <ContactSellerForm
              :listing-id="listing.id"
              :seller-name="listing.sellerName"
            />
          </div>
        </div>
      </article>
    </main>
  </div>
</template>
