<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import { isValidEmail, isValidPassword, isNonEmpty } from '@/utils/validators'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const apiError = useApiError()

const email = ref('')
const password = ref('')
const loading = ref(false)

const clientErrors = reactive<Record<string, string>>({})

// If an admin is already signed in, skip straight to the queue.
onMounted(() => {
  if (auth.role === 'admin') {
    void router.replace({ name: 'admin-verifications' })
  }
})

function validate(): boolean {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]
  if (!isNonEmpty(email.value)) clientErrors.email = 'Email is required.'
  else if (!isValidEmail(email.value))
    clientErrors.email = 'Enter a valid email address.'
  if (!isNonEmpty(password.value)) clientErrors.password = 'Password is required.'
  else if (!isValidPassword(password.value))
    clientErrors.password = 'Password must be at least 8 characters.'
  return Object.keys(clientErrors).length === 0
}

function fieldError(field: string): string | undefined {
  return clientErrors[field] ?? apiError.fieldError(field)
}

async function onSubmit(): Promise<void> {
  apiError.clear()
  if (!validate()) return

  loading.value = true
  try {
    // Uses the SAME login action as the normal portal.
    const user = await auth.login({
      email: email.value.trim(),
      password: password.value,
    })

    // UI-LEVEL GATE ONLY. Real enforcement is the backend's requireRole('admin')
    // on every /api/admin/* route. Here we simply refuse to enter the admin area
    // with a non-admin account and clear the just-created session.
    if (user.role !== 'admin') {
      auth.logout()
      apiError.setError({
        message: 'This portal is for administrators only.',
        error: 'NOT_ADMIN',
      })
      return
    }

    const redirect = route.query.redirect
    const target =
      typeof redirect === 'string' && redirect.startsWith('/admin')
        ? redirect
        : { name: 'admin-verifications' as const }
    await router.replace(target)
  } catch (err) {
    apiError.setError(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main
    class="flex min-h-full items-center justify-center bg-slate-900 px-4 py-12"
  >
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-200 ring-1 ring-slate-700"
          aria-hidden="true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Admin Portal</h1>
        <p class="mt-1 text-sm text-slate-400">
          Verification &amp; moderation access
        </p>
      </div>

      <form
        class="space-y-5 rounded-2xl border border-slate-700 bg-white p-8 shadow-xl"
        novalidate
        @submit.prevent="onSubmit"
      >
        <AlertBanner
          v-if="apiError.message.value"
          variant="error"
          :message="apiError.message.value"
        />

        <BaseInput
          id="admin-email"
          v-model="email"
          label="Admin email"
          type="email"
          placeholder="admin@example.com"
          autocomplete="email"
          required
          :error="fieldError('email')"
        />

        <BaseInput
          id="admin-password"
          v-model="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          :error="fieldError('password')"
        />

        <BaseButton type="submit" block :loading="loading">
          {{ loading ? 'Signing in…' : 'Sign in to admin' }}
        </BaseButton>
      </form>

      <p class="mt-6 text-center text-xs text-slate-500">
        Not an administrator?
        <RouterLink :to="{ name: 'login' }" class="font-medium text-slate-300 hover:text-white">
          Go to the main sign in
        </RouterLink>
      </p>
    </div>
  </main>
</template>
