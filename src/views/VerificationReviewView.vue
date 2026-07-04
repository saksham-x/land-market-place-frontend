<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  getPendingListings,
  getVerificationHistory,
  approveListing,
  rejectListing,
} from '@/api/verification'
import { useApiError } from '@/composables/useApiError'
import type {
  PendingListing,
  VerificationDecision,
  VerificationRecord,
} from '@/types'
import { formatNpr, formatAreaFull, formatDate } from '@/utils/format'
import { sellerName, sellerEmail } from '@/utils/verification'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const route = useRoute()
const router = useRouter()
const apiError = useApiError() // initial load
const actionError = useApiError() // approve/reject

const listingId = computed(() =>
  typeof route.params.listingId === 'string' ? route.params.listingId : undefined,
)

const loading = ref(false)
const notFound = ref(false)
const listing = ref<PendingListing | null>(null)

const history = ref<VerificationRecord[]>([])
const historyLoading = ref(false)
const historyError = ref<string | null>(null)

const runningAction = ref<string | null>(null)
const busy = computed(() => runningAction.value !== null)

const rejectOpen = ref(false)
const rejectReason = ref('')
const rejectClientError = ref<string | undefined>(undefined)
const rejectError = computed(
  () => rejectClientError.value ?? actionError.fieldError('reason'),
)

function decisionBadge(decision: VerificationDecision): string {
  return decision === 'approved'
    ? 'bg-brand-100 text-brand-700'
    : 'bg-red-100 text-red-700'
}

async function loadHistory(id: string): Promise<void> {
  historyLoading.value = true
  historyError.value = null
  try {
    history.value = await getVerificationHistory(id)
  } catch {
    // History is supplementary — don't block the review if it fails.
    history.value = []
    historyError.value = 'Could not load verification history.'
  } finally {
    historyLoading.value = false
  }
}

async function load(): Promise<void> {
  const id = listingId.value
  if (!id) return
  loading.value = true
  apiError.clear()
  notFound.value = false
  try {
    // Source the full listing from the pending queue payload — the seller-owned
    // GET /api/listings/:id would 403 for an admin, so we deliberately avoid it.
    const pending = await getPendingListings()
    const match = pending.find((item) => item.id === id) ?? null
    listing.value = match
    if (!match) {
      notFound.value = true
      return
    }
    await loadHistory(id)
  } catch (err) {
    apiError.setError(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function onApprove(): Promise<void> {
  const id = listingId.value
  if (!id) return
  actionError.clear()
  runningAction.value = 'approve'
  try {
    await approveListing(id)
    await router.push({ name: 'admin-verifications' })
  } catch (err) {
    actionError.setError(err)
    runningAction.value = null
  }
}

function openReject(): void {
  actionError.clear()
  rejectClientError.value = undefined
  rejectOpen.value = true
}

function cancelReject(): void {
  rejectOpen.value = false
  rejectReason.value = ''
  rejectClientError.value = undefined
}

function validateReject(): boolean {
  const reason = rejectReason.value.trim()
  if (!reason) {
    rejectClientError.value = 'A reason is required.'
    return false
  }
  if (reason.length < 5) {
    rejectClientError.value = 'Reason must be at least 5 characters.'
    return false
  }
  rejectClientError.value = undefined
  return true
}

async function onReject(): Promise<void> {
  const id = listingId.value
  if (!id) return
  actionError.clear()
  if (!validateReject()) return
  runningAction.value = 'reject'
  try {
    await rejectListing(id, rejectReason.value.trim())
    await router.push({ name: 'admin-verifications' })
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
        :to="{ name: 'admin-verifications' }"
        class="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        ← Back to queue
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

      <!-- Not found / already actioned -->
      <div
        v-else-if="notFound"
        class="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
      >
        <h1 class="text-xl font-bold text-gray-900">
          Listing no longer pending
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
          It may have already been approved or rejected by another admin.
        </p>
        <div class="mt-6">
          <RouterLink :to="{ name: 'admin-verifications' }">
            <BaseButton>Back to queue</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- Load error -->
      <AlertBanner
        v-else-if="apiError.message.value"
        variant="error"
        :message="apiError.message.value"
      />

      <!-- Review -->
      <div v-else-if="listing" class="space-y-6">
        <!-- Listing detail -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <h1 class="text-2xl font-bold text-gray-900">
                {{ listing.title }}
              </h1>
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
                Submitted
              </dt>
              <dd class="mt-1 text-sm font-semibold text-gray-900">
                {{ formatDate(listing.createdAt) }}
              </dd>
            </div>
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Listing ID
              </dt>
              <dd class="mt-1 truncate text-sm font-semibold text-gray-900" :title="listing.id">
                {{ listing.id }}
              </dd>
            </div>
          </dl>

          <!-- Seller context -->
          <div class="mt-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400">
              Submitted by
            </p>
            <p class="mt-1 text-sm font-semibold text-gray-900">
              {{ sellerName(listing) }}
            </p>
            <p v-if="sellerEmail(listing)" class="text-sm text-gray-500">
              {{ sellerEmail(listing) }}
            </p>
          </div>

          <section class="mt-6">
            <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h2>
            <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {{ listing.description }}
            </p>
          </section>
        </div>

        <!-- Decision -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Decision
          </h2>

          <AlertBanner
            v-if="actionError.message.value"
            variant="error"
            class="mt-4"
            :message="actionError.message.value"
          />

          <!-- Default actions -->
          <div v-if="!rejectOpen" class="mt-4 flex flex-wrap gap-3">
            <BaseButton
              :loading="runningAction === 'approve'"
              :disabled="busy"
              @click="onApprove"
            >
              Approve listing
            </BaseButton>
            <BaseButton
              variant="secondary"
              :disabled="busy"
              @click="openReject"
            >
              Reject…
            </BaseButton>
          </div>

          <!-- Reject form -->
          <form v-else class="mt-4 space-y-3" novalidate @submit.prevent="onReject">
            <BaseTextarea
              id="reject-reason"
              v-model="rejectReason"
              label="Reason for rejection"
              :rows="4"
              placeholder="Explain what needs to change (min 5 characters). The seller will see this."
              required
              :error="rejectError"
            />
            <div class="flex gap-3">
              <BaseButton
                type="submit"
                variant="primary"
                :loading="runningAction === 'reject'"
                :disabled="busy"
              >
                Confirm rejection
              </BaseButton>
              <BaseButton
                type="button"
                variant="secondary"
                :disabled="busy"
                @click="cancelReject"
              >
                Cancel
              </BaseButton>
            </div>
          </form>
        </div>

        <!-- Audit history -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Verification history
          </h2>

          <p v-if="historyLoading" class="mt-3 text-sm text-gray-400">
            Loading history…
          </p>

          <p v-else-if="historyError" class="mt-3 text-sm text-amber-600">
            {{ historyError }}
          </p>

          <p
            v-else-if="history.length === 0"
            class="mt-3 text-sm text-gray-400"
          >
            No prior decisions — this is the first review for this listing.
          </p>

          <ol v-else class="mt-4 space-y-4">
            <li
              v-for="record in history"
              :key="record.id"
              class="border-l-2 border-gray-100 pl-4"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                  :class="decisionBadge(record.decision)"
                >
                  {{ record.decision }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ formatDate(record.reviewedAt) }}
                </span>
              </div>
              <p
                v-if="record.reason"
                class="mt-1 text-sm text-gray-600"
              >
                "{{ record.reason }}"
              </p>
            </li>
          </ol>
        </div>
      </div>
    </main>
  </div>
</template>
