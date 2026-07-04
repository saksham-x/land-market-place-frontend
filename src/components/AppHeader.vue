<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const isAdmin = computed(() => auth.role === 'admin')

const initials = computed(() => {
  const source = auth.user?.fullName || auth.user?.email || '?'
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

async function onLogout(): Promise<void> {
  const wasAdmin = isAdmin.value
  auth.logout()
  await router.push(wasAdmin ? { name: 'admin-login' } : { name: 'browse' })
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <RouterLink
        :to="isAdmin ? { name: 'admin-verifications' } : { name: 'browse' }"
        class="flex items-center gap-2 text-lg font-bold text-brand-700"
      >
        Land Marketplace
        <!-- Subtle admin-context cue. -->
        <span
          v-if="isAdmin"
          class="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-100"
        >
          Admin
        </span>
      </RouterLink>

      <nav class="flex items-center gap-1 sm:gap-3">
        <!-- Admin: only admin-relevant links -->
        <template v-if="isAdmin">
          <RouterLink
            :to="{ name: 'admin-verifications' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            active-class="text-brand-700"
          >
            Verification Queue
          </RouterLink>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-100"
            :title="auth.user?.fullName || auth.user?.email || ''"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            @click="onLogout"
          >
            Log out
          </button>
        </template>

        <!-- Guests -->
        <template v-else-if="!auth.isAuthenticated">
          <RouterLink
            :to="{ name: 'browse' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            active-class="text-brand-700"
          >
            Browse
          </RouterLink>
          <RouterLink
            :to="{ name: 'login' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Log in
          </RouterLink>
          <RouterLink
            :to="{ name: 'register' }"
            class="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Sign up
          </RouterLink>
        </template>

        <!-- Sellers / buyers -->
        <template v-else>
          <RouterLink
            :to="{ name: 'browse' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            active-class="text-brand-700"
          >
            Browse
          </RouterLink>
          <!-- Sellers get a shortcut to their listing management. -->
          <RouterLink
            v-if="auth.role === 'seller'"
            :to="{ name: 'seller-listings' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            active-class="text-brand-700"
          >
            My Listings
          </RouterLink>
          <RouterLink
            :to="{ name: 'home' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Dashboard
          </RouterLink>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
            :title="auth.user?.fullName || auth.user?.email || ''"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            @click="onLogout"
          >
            Log out
          </button>
        </template>
      </nav>
    </div>
  </header>
</template>
