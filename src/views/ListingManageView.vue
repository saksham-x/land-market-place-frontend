<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  getListing,
  getPayment,
  submitListing,
  payListing,
  markSold,
  relistListing,
  deleteListing,
} from '@/api/listings'
import { getListingLeads } from '@/api/contact'
import { useApiError, isNormalizedApiError } from '@/composables/useApiError'
import type { Lead, OwnerListing, Payment } from '@/types'
import { statusMeta } from '@/utils/listing'
import { formatNpr, formatAreaFull, formatDate } from '@/utils/format'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import LeadCard from '@/components/LeadCard.vue'

const route = useRoute()
const router = useRouter()
const apiError = useApiError() // initial load errors
const actionError = useApiError() // action errors (keep the listing visible)

const listingId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : undefined,
)

const loading = ref(false)
const forbidden = ref(false)
const notFound = ref(false)
const listing = ref<OwnerListing | null>(null)
const payment = ref<Payment | null>(null)

const leads = ref<Lead[]>([])
const leadsLoading = ref(false)
const leadsError = ref<string | null>(null)

/** Which action is currently running (drives per-button spinners). */
const runningAction = ref<string | null>(null)
const busy = computed(() => runningAction.value !== null)

const meta = computed(() =>
  listing.value ? statusMeta(listing.value.status) : null,
)

// Inquiries only exist for listings that have been publicly live at some point.
const hasBeenLive = computed(
  () =>
    !!listing.value &&
    ['verified', 'sold', 'expired'].includes(listing.value.status),
)

async function loadLeads(id: string): Promise<void> {
  leadsLoading.value = true
  leadsError.value = null
  try {
    leads.value = await getListingLeads(id)
  } catch {
    // Owner-gated endpoint; failure is non-fatal to the rest of the page.
    leads.value = []
    leadsError.value = 'Could not load inquiries.'
  } finally {
    leadsLoading.value = false
  }
}

async function loadPayment(id: string): Promise<void> {
  try {
    payment.value = await getPayment(id)
  } catch {
    // No payment record yet (or not applicable) — non-fatal.
    payment.value = null
  }
}

async function fetchListing(): Promise<void> {
  const id = listingId.value
  if (!id) return
  apiError.clear()
  forbidden.value = false
  notFound.value = false
  try {
    const result = await getListing(id)
    listing.value = result
    if (
      result.status === 'pending_payment' ||
      result.status === 'pending_verification'
    ) {
      await loadPayment(id)
    } else {
      payment.value = null
    }
    if (['verified', 'sold', 'expired'].includes(result.status)) {
      await loadLeads(id)
    } else {
      leads.value = []
    }
  } catch (err) {
    if (isNormalizedApiError(err) && err.status === 403) forbidden.value = true
    else if (isNormalizedApiError(err) && err.status === 404)
      notFound.value = true
    else apiError.setError(err)
  }
}

onMounted(async () => {
  loading.value = true
  await fetchListing()
  loading.value = false
})

/** Run a status action, then quietly refetch so the UI advances. */
async function runAction(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  actionError.clear()
  runningAction.value = label
  try {
    await fn()
    await fetchListing()
  } catch (err) {
    actionError.setError(err)
  } finally {
    runningAction.value = null
  }
}

function onSubmitForReview(): void {
  const id = listingId.value
  if (!id) return
  runAction('submit', () => submitListing(id))
}

function onPay(): void {
  const id = listingId.value
  if (!id) return
  runAction('pay', () => payListing(id))
}

function onMarkSold(): void {
  const id = listingId.value
  if (!id) return
  if (
    !window.confirm(
      'Mark this listing as sold? This is final and cannot be undone.',
    )
  )
    return
  runAction('sold', () => markSold(id))
}

function onRelist(): void {
  const id = listingId.value
  if (!id) return
  runAction('relist', () => relistListing(id))
}

async function onDelete(): Promise<void> {
  const id = listingId.value
  if (!id) return
  if (
    !window.confirm('Delete this listing permanently? This cannot be undone.')
  )
    return
  actionError.clear()
  runningAction.value = 'delete'
  try {
    await deleteListing(id)
    await router.push({ name: 'seller-listings' })
  } catch (err) {
    actionError.setError(err)
    runningAction.value = null
  }
}
</script>

<template>
  <div class="min-h-full bg-gray-50">
    <AppHeader />

    <main class="mx-auto max-w-3xl px-4 py-8">
      <RouterLink
        :to="{ name: 'seller-listings' }"
        class="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        ← Back to my listings
      </RouterLink>

      <!-- Loading -->
      <div
        v-if="loading"
        class="animate-pulse space-y-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
      >
        <div class="h-6 w-2/3 rounded bg-gray-100"></div>
        <div class="h-8 w-1/3 rounded bg-gray-100"></div>
        <div class="h-20 w-full rounded bg-gray-100"></div>
      </div>

      <!-- 403 -->
      <div
        v-else-if="forbidden"
        class="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
      >
        <h1 class="text-xl font-bold text-gray-900">This isn't your listing</h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
          You can only manage listings that you own.
        </p>
        <div class="mt-6">
          <RouterLink :to="{ name: 'seller-listings' }">
            <BaseButton>Back to my listings</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- 404 -->
      <div
        v-else-if="notFound"
        class="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
      >
        <h1 class="text-xl font-bold text-gray-900">Listing not found</h1>
        <div class="mt-6">
          <RouterLink :to="{ name: 'seller-listings' }">
            <BaseButton>Back to my listings</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- Generic load error -->
      <AlertBanner
        v-else-if="apiError.message.value"
        variant="error"
        :message="apiError.message.value"
      />

      <!-- Listing -->
      <div v-else-if="listing" class="space-y-6">
        <!-- Header card -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold text-gray-900">
                  {{ listing.title }}
                </h1>
                <StatusBadge :status="listing.status" />
              </div>
              <p class="mt-1 text-sm text-gray-500">
                {{ listing.city }}, {{ listing.district }},
                {{ listing.province }}
              </p>
            </div>
            <p class="text-2xl font-bold text-brand-700">
              {{ formatNpr(listing.price) }}
            </p>
          </div>

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
                Created
              </dt>
              <dd class="mt-1 text-sm font-semibold text-gray-900">
                {{ formatDate(listing.createdAt) }}
              </dd>
            </div>
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Updated
              </dt>
              <dd class="mt-1 text-sm font-semibold text-gray-900">
                {{ formatDate(listing.updatedAt) }}
              </dd>
            </div>
          </dl>

          <section class="mt-6">
            <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h2>
            <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {{ listing.description }}
            </p>
          </section>
        </div>

        <!-- Guided next-step card -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Next steps
          </h2>
          <p v-if="meta" class="mt-1 text-sm text-gray-600">
            {{ meta.description }}
          </p>

          <AlertBanner
            v-if="actionError.message.value"
            variant="error"
            class="mt-4"
            :message="actionError.message.value"
          />

          <!-- draft -->
          <div
            v-if="listing.status === 'draft'"
            class="mt-4 flex flex-wrap gap-3"
          >
            <RouterLink
              :to="{ name: 'seller-listing-edit', params: { id: listing.id } }"
            >
              <BaseButton variant="secondary" :disabled="busy">Edit</BaseButton>
            </RouterLink>
            <BaseButton
              :loading="runningAction === 'submit'"
              :disabled="busy"
              @click="onSubmitForReview"
            >
              Submit for review
            </BaseButton>
            <BaseButton
              variant="secondary"
              :loading="runningAction === 'delete'"
              :disabled="busy"
              @click="onDelete"
            >
              Delete
            </BaseButton>
          </div>

          <!-- pending_payment -->
          <div v-else-if="listing.status === 'pending_payment'" class="mt-4">
            <div class="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p class="font-medium">
                Listing fee{{ payment ? `: ${formatNpr(payment.amount)}` : '' }}
              </p>
              <p class="mt-1 text-amber-700">
                This is a dummy/test payment for now — no real charge is made.
              </p>
            </div>
            <div class="mt-4">
              <BaseButton
                :loading="runningAction === 'pay'"
                :disabled="busy"
                @click="onPay"
              >
                Pay listing fee
              </BaseButton>
            </div>
          </div>

          <!-- pending_verification -->
          <div
            v-else-if="listing.status === 'pending_verification'"
            class="mt-4"
          >
            <div class="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Under review by an admin — you'll be notified once it's verified.
              No action is needed right now.
            </div>
            <dl
              v-if="payment"
              class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"
            >
              <div>
                <dt class="text-gray-400">Fee paid</dt>
                <dd class="font-medium text-gray-900">
                  {{ formatNpr(payment.amount) }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-400">Payment status</dt>
                <dd class="font-medium capitalize text-gray-900">
                  {{ payment.status }}
                </dd>
              </div>
              <div v-if="payment.paidAt">
                <dt class="text-gray-400">Paid on</dt>
                <dd class="font-medium text-gray-900">
                  {{ formatDate(payment.paidAt) }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- verified -->
          <div
            v-else-if="listing.status === 'verified'"
            class="mt-4 flex flex-wrap items-center gap-3"
          >
            <RouterLink
              :to="{ name: 'listing-detail', params: { id: listing.id } }"
              class="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View public page →
            </RouterLink>
            <span class="hidden text-gray-300 sm:inline">|</span>
            <BaseButton
              :loading="runningAction === 'sold'"
              :disabled="busy"
              @click="onMarkSold"
            >
              Mark as sold
            </BaseButton>
          </div>

          <!-- rejected (backend usually reverts to draft; handle defensively) -->
          <div
            v-else-if="listing.status === 'rejected'"
            class="mt-4 flex flex-wrap gap-3"
          >
            <RouterLink
              :to="{ name: 'seller-listing-edit', params: { id: listing.id } }"
            >
              <BaseButton variant="secondary" :disabled="busy">
                Edit details
              </BaseButton>
            </RouterLink>
            <BaseButton
              :loading="runningAction === 'submit'"
              :disabled="busy"
              @click="onSubmitForReview"
            >
              Resubmit for review
            </BaseButton>
          </div>

          <!-- sold -->
          <div v-else-if="listing.status === 'sold'" class="mt-4">
            <div class="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
              This listing has been sold and is now read-only.
            </div>
          </div>

          <!-- expired -->
          <div v-else-if="listing.status === 'expired'" class="mt-4">
            <div class="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
              This listing has expired. Relisting sends it back for verification
              — you won't be charged again.
            </div>
            <div class="mt-4">
              <BaseButton
                :loading="runningAction === 'relist'"
                :disabled="busy"
                @click="onRelist"
              >
                Relist
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Inquiries / leads (only for listings that have been publicly live) -->
        <div
          v-if="hasBeenLive"
          class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Inquiries
            </h2>
            <span
              v-if="!leadsLoading && leads.length"
              class="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700"
            >
              {{ leads.length }}
            </span>
          </div>

          <p v-if="leadsLoading" class="mt-3 text-sm text-gray-400">
            Loading inquiries…
          </p>
          <p v-else-if="leadsError" class="mt-3 text-sm text-amber-600">
            {{ leadsError }}
          </p>
          <p v-else-if="leads.length === 0" class="mt-3 text-sm text-gray-400">
            No inquiries yet.
          </p>
          <div v-else class="mt-4 space-y-3">
            <LeadCard v-for="lead in leads" :key="lead.id" :lead="lead" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
