<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

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
  auth.logout()
  await router.push({ name: 'browse' })
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <RouterLink
        :to="{ name: 'browse' }"
        class="text-lg font-bold text-brand-700"
      >
        Land Marketplace
      </RouterLink>

      <nav class="flex items-center gap-1 sm:gap-3">
        <RouterLink
          :to="{ name: 'browse' }"
          class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          active-class="text-brand-700"
        >
          Browse
        </RouterLink>

        <!-- Logged out: Login / Register -->
        <template v-if="!auth.isAuthenticated">
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

        <!-- Logged in: dashboard link + avatar + logout -->
        <template v-else>
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
