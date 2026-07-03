<script setup lang="ts">
import { ref, reactive } from 'vue'
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

function validate(): boolean {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]

  if (!isNonEmpty(email.value)) {
    clientErrors.email = 'Email is required.'
  } else if (!isValidEmail(email.value)) {
    clientErrors.email = 'Enter a valid email address.'
  }

  if (!isNonEmpty(password.value)) {
    clientErrors.password = 'Password is required.'
  } else if (!isValidPassword(password.value)) {
    clientErrors.password = 'Password must be at least 8 characters.'
  }

  return Object.keys(clientErrors).length === 0
}

/** Merge client-side and server-side (validationErrors) messages per field. */
function fieldError(field: string): string | undefined {
  return clientErrors[field] ?? apiError.fieldError(field)
}

async function onSubmit(): Promise<void> {
  apiError.clear()
  if (!validate()) return

  loading.value = true
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    const redirect = route.query.redirect
    const target = typeof redirect === 'string' ? redirect : '/'
    await router.replace(target)
  } catch (err) {
    apiError.setError(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-full items-center justify-center bg-gray-50 px-4 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-gray-900">Land Marketplace</h1>
        <p class="mt-1 text-sm text-gray-500">Sign in to your account</p>
      </div>

      <form
        class="space-y-5 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        novalidate
        @submit.prevent="onSubmit"
      >
        <AlertBanner
          v-if="apiError.message.value"
          variant="error"
          :message="apiError.message.value"
        />

        <BaseInput
          id="email"
          v-model="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
          :error="fieldError('email')"
        />

        <BaseInput
          id="password"
          v-model="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          :error="fieldError('password')"
        />

        <BaseButton type="submit" block :loading="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </BaseButton>

        <p class="text-center text-sm text-gray-600">
          Don't have an account?
          <RouterLink
            :to="{ name: 'register' }"
            class="font-semibold text-brand-600 hover:text-brand-700"
          >
            Create one
          </RouterLink>
        </p>
      </form>
    </div>
  </main>
</template>
