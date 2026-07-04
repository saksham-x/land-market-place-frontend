<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { browseListings } from '@/api/browse'
import { useApiError } from '@/composables/useApiError'
import type { BrowseFilters, BrowseResponse } from '@/types'
import AppHeader from '@/components/AppHeader.vue'
import ListingCard from '@/components/ListingCard.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const route = useRoute()
const router = useRouter()
const apiError = useApiError()

const loading = ref(false)
const data = ref<BrowseResponse | null>(null)
const mobileFiltersOpen = ref(false)

// The editable filter form (strings — the URL query is the source of truth).
const form = reactive({
  q: '',
  province: '',
  district: '',
  city: '',
  priceMin: '',
  priceMax: '',
  areaMinSqm: '',
  areaMaxSqm: '',
})

type QueryValue = string | null | (string | null)[] | undefined

function firstStr(value: QueryValue): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return v == null || v === '' ? undefined : v
}

function toNum(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

/** Mirror the current URL query back into the form inputs. */
function syncFormFromQuery(): void {
  form.q = firstStr(route.query.q) ?? ''
  form.province = firstStr(route.query.province) ?? ''
  form.district = firstStr(route.query.district) ?? ''
  form.city = firstStr(route.query.city) ?? ''
  form.priceMin = firstStr(route.query.priceMin) ?? ''
  form.priceMax = firstStr(route.query.priceMax) ?? ''
  form.areaMinSqm = firstStr(route.query.areaMinSqm) ?? ''
  form.areaMaxSqm = firstStr(route.query.areaMaxSqm) ?? ''
}

/** Build typed API filters from the URL query. */
function filtersFromQuery(): BrowseFilters {
  return {
    page: toNum(firstStr(route.query.page)) ?? 1,
    q: firstStr(route.query.q),
    province: firstStr(route.query.province),
    district: firstStr(route.query.district),
    city: firstStr(route.query.city),
    priceMin: toNum(firstStr(route.query.priceMin)),
    priceMax: toNum(firstStr(route.query.priceMax)),
    areaMinSqm: toNum(firstStr(route.query.areaMinSqm)),
    areaMaxSqm: toNum(firstStr(route.query.areaMaxSqm)),
  }
}

/** Collect only the non-empty form values into a query object. */
function buildQueryFromForm(): Record<string, string> {
  const query: Record<string, string> = {}
  const set = (key: string, value: string): void => {
    const trimmed = value.trim()
    if (trimmed) query[key] = trimmed
  }
  set('q', form.q)
  set('province', form.province)
  set('district', form.district)
  set('city', form.city)
  set('priceMin', form.priceMin)
  set('priceMax', form.priceMax)
  set('areaMinSqm', form.areaMinSqm)
  set('areaMaxSqm', form.areaMaxSqm)
  return query
}

async function load(): Promise<void> {
  loading.value = true
  apiError.clear()
  try {
    data.value = await browseListings(filtersFromQuery())
  } catch (err) {
    apiError.setError(err)
    data.value = null
  } finally {
    loading.value = false
  }
}

// URL query is the single source of truth: any change refetches + resyncs form.
watch(
  () => route.query,
  () => {
    syncFormFromQuery()
    void load()
  },
  { immediate: true },
)

// Applying filters resets to page 1 (no `page` key in the new query).
function applyFilters(): void {
  mobileFiltersOpen.value = false
  router.push({ name: 'browse', query: buildQueryFromForm() })
}

function clearFilters(): void {
  mobileFiltersOpen.value = false
  router.push({ name: 'browse', query: {} })
}

const currentPage = computed(() => data.value?.page ?? 1)
const totalPages = computed(() => data.value?.totalPages ?? 1)
const total = computed(() => data.value?.total ?? 0)

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return
  router.push({
    name: 'browse',
    query: { ...route.query, page: String(page) },
  })
}
</script>

<template>
  <div class="min-h-full bg-gray-50">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Browse land</h1>
          <p class="mt-1 text-sm text-gray-500">
            Find verified plots across Nepal.
          </p>
        </div>
        <BaseButton
          variant="secondary"
          class="lg:hidden"
          @click="mobileFiltersOpen = !mobileFiltersOpen"
        >
          {{ mobileFiltersOpen ? 'Hide filters' : 'Filters' }}
        </BaseButton>
      </div>

      <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <!-- Filter panel -->
        <aside
          class="h-fit rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-20"
          :class="mobileFiltersOpen ? 'block' : 'hidden lg:block'"
        >
          <form class="space-y-4" novalidate @submit.prevent="applyFilters">
            <BaseInput
              id="filter-q"
              v-model="form.q"
              label="Search"
              placeholder="Title or description"
            />

            <div class="space-y-3">
              <BaseInput
                id="filter-province"
                v-model="form.province"
                label="Province"
                placeholder="e.g. Bagmati"
              />
              <BaseInput
                id="filter-district"
                v-model="form.district"
                label="District"
                placeholder="e.g. Kathmandu"
              />
              <BaseInput
                id="filter-city"
                v-model="form.city"
                label="City"
                placeholder="e.g. Lalitpur"
              />
            </div>

            <div>
              <p class="mb-1 text-sm font-medium text-gray-700">Price (Rs)</p>
              <div class="grid grid-cols-2 gap-2">
                <BaseInput
                  id="filter-price-min"
                  v-model="form.priceMin"
                  label="Min"
                  type="number"
                  placeholder="0"
                />
                <BaseInput
                  id="filter-price-max"
                  v-model="form.priceMax"
                  label="Max"
                  type="number"
                  placeholder="Any"
                />
              </div>
            </div>

            <div>
              <p class="mb-1 text-sm font-medium text-gray-700">
                Area (m²)
              </p>
              <div class="grid grid-cols-2 gap-2">
                <BaseInput
                  id="filter-area-min"
                  v-model="form.areaMinSqm"
                  label="Min"
                  type="number"
                  placeholder="0"
                />
                <BaseInput
                  id="filter-area-max"
                  v-model="form.areaMaxSqm"
                  label="Max"
                  type="number"
                  placeholder="Any"
                />
              </div>
              <p class="mt-1 text-xs text-gray-400">
                Area filters use square metres across all listings.
              </p>
            </div>

            <div class="flex gap-2 pt-1">
              <BaseButton type="submit" block>Apply filters</BaseButton>
              <BaseButton type="button" variant="secondary" @click="clearFilters">
                Clear
              </BaseButton>
            </div>
          </form>
        </aside>

        <!-- Results -->
        <section>
          <!-- Error -->
          <AlertBanner
            v-if="apiError.message.value"
            variant="error"
            class="mb-4"
            :message="apiError.message.value"
          />

          <!-- Result count -->
          <p v-if="!loading && data" class="mb-4 text-sm text-gray-500">
            {{ total }} {{ total === 1 ? 'listing' : 'listings' }} found
          </p>

          <!-- Loading skeletons -->
          <div
            v-if="loading"
            class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div class="h-28 bg-gray-100"></div>
              <div class="space-y-3 p-4">
                <div class="h-4 w-3/4 rounded bg-gray-100"></div>
                <div class="h-5 w-1/2 rounded bg-gray-100"></div>
                <div class="h-3 w-2/3 rounded bg-gray-100"></div>
                <div class="h-3 w-full rounded bg-gray-100"></div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="data && total === 0"
            class="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center"
          >
            <div
              class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
              aria-hidden="true"
            >
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="7" />
                <path stroke-linecap="round" d="M21 21l-4.3-4.3" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900">
              No listings found
            </h3>
            <p class="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              Try adjusting or clearing your filters to see more results.
            </p>
            <div class="mt-4">
              <BaseButton variant="secondary" @click="clearFilters">
                Clear filters
              </BaseButton>
            </div>
          </div>

          <!-- Results grid -->
          <div
            v-else-if="data"
            class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            <ListingCard
              v-for="item in data.items"
              :key="item.id"
              :listing="item"
            />
          </div>

          <!-- Pagination -->
          <div
            v-if="data && total > 0"
            class="mt-8 flex items-center justify-between"
          >
            <BaseButton
              variant="secondary"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              ← Prev
            </BaseButton>
            <span class="text-sm text-gray-600">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <BaseButton
              variant="secondary"
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Next →
            </BaseButton>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
