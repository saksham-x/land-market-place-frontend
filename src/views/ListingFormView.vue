<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { createListing, getListing, updateListing } from '@/api/listings'
import { useApiError, isNormalizedApiError } from '@/composables/useApiError'
import type { AreaUnit, CreateListingPayload } from '@/types'
import { AREA_UNIT_OPTIONS } from '@/utils/listing'
import AppHeader from '@/components/AppHeader.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const route = useRoute()
const router = useRouter()
const apiError = useApiError()

const listingId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id : undefined,
)
const isEdit = computed(() => !!listingId.value)

const loading = ref(false) // edit-mode initial fetch
const submitting = ref(false)
const notDraft = ref(false) // edit blocked: listing isn't a draft
const forbidden = ref(false) // 403 not your listing
const notFound = ref(false) // 404

const form = reactive({
  title: '',
  description: '',
  price: '',
  province: '',
  district: '',
  city: '',
  areaValue: '',
  areaUnit: 'ropani' as string,
})

const clientErrors = reactive<Record<string, string>>({})

function fieldError(field: string): string | undefined {
  return clientErrors[field] ?? apiError.fieldError(field)
}

// Load the listing when editing; enforce the backend's draft-only edit rule.
onMounted(async () => {
  const id = listingId.value
  if (!id) return
  loading.value = true
  try {
    const listing = await getListing(id)
    if (listing.status !== 'draft') {
      notDraft.value = true
      return
    }
    form.title = listing.title
    form.description = listing.description
    form.price = String(listing.price)
    form.province = listing.province
    form.district = listing.district
    form.city = listing.city
    form.areaValue = String(listing.areaValue)
    form.areaUnit = listing.areaUnit
  } catch (err) {
    if (isNormalizedApiError(err) && err.status === 403) forbidden.value = true
    else if (isNormalizedApiError(err) && err.status === 404) notFound.value = true
    else apiError.setError(err)
  } finally {
    loading.value = false
  }
})

function validate(): boolean {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]

  const title = form.title.trim()
  if (!title) clientErrors.title = 'Title is required.'
  else if (title.length < 3)
    clientErrors.title = 'Title must be at least 3 characters.'

  const description = form.description.trim()
  if (!description) clientErrors.description = 'Description is required.'
  else if (description.length < 10)
    clientErrors.description = 'Description must be at least 10 characters.'

  // Numeric fields: a number input can bind as either a string or a number, so
  // coerce via String() (never call .trim() on a possible number) and validate
  // the parsed result. An empty value fails cleanly as "required".
  const priceStr = String(form.price ?? '').trim()
  const price = Number(priceStr)
  if (!priceStr) clientErrors.price = 'Price is required.'
  else if (!Number.isFinite(price) || price <= 0)
    clientErrors.price = 'Enter a price greater than 0.'

  if (!form.province.trim()) clientErrors.province = 'Province is required.'
  if (!form.district.trim()) clientErrors.district = 'District is required.'
  if (!form.city.trim()) clientErrors.city = 'City is required.'

  const areaStr = String(form.areaValue ?? '').trim()
  const area = Number(areaStr)
  if (!areaStr) clientErrors.areaValue = 'Area is required.'
  else if (!Number.isFinite(area) || area <= 0)
    clientErrors.areaValue = 'Enter an area greater than 0.'

  return Object.keys(clientErrors).length === 0
}

async function onSubmit(): Promise<void> {
  apiError.clear()
  if (!validate()) return

  const payload: CreateListingPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    province: form.province.trim(),
    district: form.district.trim(),
    city: form.city.trim(),
    areaValue: Number(form.areaValue),
    areaUnit: form.areaUnit as AreaUnit,
  }

  submitting.value = true
  try {
    const id = listingId.value
    const saved = id
      ? await updateListing(id, payload)
      : await createListing(payload)
    // Both paths land on the guided manage page for the listing.
    await router.replace({
      name: 'seller-listing-manage',
      params: { id: saved.id },
    })
  } catch (err) {
    apiError.setError(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-full bg-gray-50">
    <AppHeader />

    <main class="mx-auto max-w-2xl px-4 py-8">
      <RouterLink
        :to="
          isEdit
            ? { name: 'seller-listing-manage', params: { id: listingId } }
            : { name: 'seller-listings' }
        "
        class="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        ← Back
      </RouterLink>

      <h1 class="mb-6 text-2xl font-bold text-gray-900">
        {{ isEdit ? 'Edit listing' : 'Create listing' }}
      </h1>

      <!-- Edit blocked: not a draft -->
      <div
        v-if="notDraft"
        class="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
      >
        <h2 class="text-lg font-semibold text-gray-900">
          Only draft listings can be edited
        </h2>
        <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Once a listing is submitted it can no longer be changed. Go back to
          manage its status.
        </p>
        <div class="mt-6">
          <RouterLink
            :to="{ name: 'seller-listing-manage', params: { id: listingId } }"
          >
            <BaseButton>Back to manage</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- 403 not your listing -->
      <div
        v-else-if="forbidden"
        class="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
      >
        <h2 class="text-lg font-semibold text-gray-900">Not your listing</h2>
        <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
          You can only edit listings that you own.
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
        <h2 class="text-lg font-semibold text-gray-900">Listing not found</h2>
        <div class="mt-6">
          <RouterLink :to="{ name: 'seller-listings' }">
            <BaseButton>Back to my listings</BaseButton>
          </RouterLink>
        </div>
      </div>

      <!-- Loading (edit fetch) -->
      <div
        v-else-if="loading"
        class="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div class="h-10 animate-pulse rounded bg-gray-100"></div>
        <div class="h-24 animate-pulse rounded bg-gray-100"></div>
        <div class="h-10 animate-pulse rounded bg-gray-100"></div>
      </div>

      <!-- Form -->
      <form
        v-else
        class="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        novalidate
        @submit.prevent="onSubmit"
      >
        <AlertBanner
          v-if="apiError.message.value"
          variant="error"
          :message="apiError.message.value"
        />

        <BaseInput
          id="title"
          v-model="form.title"
          label="Title"
          placeholder="e.g. Prime residential plot in Lalitpur"
          required
          :error="fieldError('title')"
        />

        <BaseTextarea
          id="description"
          v-model="form.description"
          label="Description"
          :rows="5"
          placeholder="Describe the land, access, amenities, frontage, etc."
          required
          :error="fieldError('description')"
        />

        <BaseInput
          id="price"
          v-model="form.price"
          label="Price (Rs)"
          type="number"
          placeholder="e.g. 25000000"
          required
          :error="fieldError('price')"
        />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BaseInput
            id="province"
            v-model="form.province"
            label="Province"
            placeholder="Bagmati"
            required
            :error="fieldError('province')"
          />
          <BaseInput
            id="district"
            v-model="form.district"
            label="District"
            placeholder="Lalitpur"
            required
            :error="fieldError('district')"
          />
          <BaseInput
            id="city"
            v-model="form.city"
            label="City"
            placeholder="Lalitpur"
            required
            :error="fieldError('city')"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseInput
            id="areaValue"
            v-model="form.areaValue"
            label="Area"
            type="number"
            placeholder="e.g. 5"
            required
            :error="fieldError('areaValue')"
          />
          <BaseSelect
            id="areaUnit"
            v-model="form.areaUnit"
            label="Unit"
            :options="AREA_UNIT_OPTIONS"
            required
            :error="fieldError('areaUnit')"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <BaseButton type="submit" :loading="submitting">
            {{ isEdit ? 'Save changes' : 'Create listing' }}
          </BaseButton>
          <RouterLink
            :to="
              isEdit
                ? { name: 'seller-listing-manage', params: { id: listingId } }
                : { name: 'seller-listings' }
            "
          >
            <BaseButton type="button" variant="secondary">Cancel</BaseButton>
          </RouterLink>
        </div>
      </form>
    </main>
  </div>
</template>
