<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/BaseButton.vue'

const router = useRouter()
const auth = useAuthStore()

const loadingProfile = ref(false)

const displayName = computed(
  () => auth.user?.fullName || auth.user?.email || 'there',
)
const initials = computed(() => {
  const source = auth.user?.fullName || auth.user?.email || '?'
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

// If we only rehydrated a token (no user yet), fetch the profile now.
onMounted(async () => {
  if (auth.isAuthenticated && !auth.user) {
    loadingProfile.value = true
    try {
      await auth.fetchMe()
    } finally {
      loadingProfile.value = false
    }
  }
})

async function onLogout(): Promise<void> {
  auth.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <div class="min-h-full bg-gray-50">
    <header class="border-b border-gray-100 bg-white">
      <div
        class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
      >
        <span class="text-lg font-bold text-brand-700">Land Marketplace</span>
        <div class="flex items-center gap-3">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
          <BaseButton variant="secondary" @click="onLogout">
            Log out
          </BaseButton>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-10">
      <div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <p v-if="loadingProfile" class="text-gray-500">Loading your profile…</p>

        <template v-else>
          <h1 class="text-2xl font-bold text-gray-900">
            Welcome, {{ displayName }} 👋
          </h1>
          <p class="mt-1 text-gray-500">
            You're signed in. This confirms the auth loop works end to end.
          </p>

          <dl class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Email
              </dt>
              <dd class="mt-1 text-sm font-medium text-gray-900">
                {{ auth.user?.email ?? '—' }}
              </dd>
            </div>
            <div class="rounded-lg bg-gray-50 px-4 py-3">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">
                Role
              </dt>
              <dd class="mt-1">
                <span
                  class="inline-flex rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand-700"
                >
                  {{ auth.role ?? '—' }}
                </span>
              </dd>
            </div>
          </dl>

          <p class="mt-8 text-sm text-gray-400">
            Listings, browsing, and other features arrive in later phases.
          </p>
        </template>
      </div>
    </main>
  </div>
</template>
