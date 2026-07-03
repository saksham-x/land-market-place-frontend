<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import { isValidEmail, isValidPassword, isNonEmpty } from '@/utils/validators'
import type { SelfRegisterRole } from '@/types'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const apiError = useApiError()

const fullName = ref('')
const email = ref('')
const password = ref('')
// Admins are never self-registered from the UI — only buyer/seller here.
const role = ref<SelfRegisterRole>('buyer')
const loading = ref(false)

const roleOptions: { value: SelfRegisterRole; label: string; hint: string }[] = [
  { value: 'buyer', label: 'Buyer', hint: 'Browse and purchase land' },
  { value: 'seller', label: 'Seller', hint: 'List and sell your land' },
]

const clientErrors = reactive<Record<string, string>>({})

function validate(): boolean {
  for (const key of Object.keys(clientErrors)) delete clientErrors[key]

  if (!isNonEmpty(fullName.value)) {
    clientErrors.fullName = 'Full name is required.'
  }

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

  if (role.value !== 'buyer' && role.value !== 'seller') {
    clientErrors.role = 'Choose an account type.'
  }

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
    await auth.register({
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      role: role.value,
    })
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
        <h1 class="text-2xl font-bold text-gray-900">Create your account</h1>
        <p class="mt-1 text-sm text-gray-500">Join the Land Marketplace</p>
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
          id="fullName"
          v-model="fullName"
          label="Full name"
          placeholder="Jane Doe"
          autocomplete="name"
          required
          :error="fieldError('fullName')"
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
          placeholder="At least 8 characters"
          autocomplete="new-password"
          required
          :error="fieldError('password')"
        />

        <!-- Role selector: buyer / seller only. -->
        <fieldset>
          <legend class="mb-1 block text-sm font-medium text-gray-700">
            I want to <span class="text-red-500">*</span>
          </legend>
          <div class="grid grid-cols-2 gap-3">
            <label
              v-for="option in roleOptions"
              :key="option.value"
              class="cursor-pointer rounded-lg border px-4 py-3 text-center transition"
              :class="
                role === option.value
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30'
                  : 'border-gray-300 hover:border-gray-400'
              "
            >
              <input
                v-model="role"
                type="radio"
                name="role"
                :value="option.value"
                class="sr-only"
              />
              <span class="block text-sm font-semibold text-gray-900">
                {{ option.label }}
              </span>
              <span class="mt-0.5 block text-xs text-gray-500">
                {{ option.hint }}
              </span>
            </label>
          </div>
          <p v-if="fieldError('role')" class="mt-1 text-sm text-red-600">
            {{ fieldError('role') }}
          </p>
        </fieldset>

        <BaseButton type="submit" block :loading="loading">
          {{ loading ? 'Creating account…' : 'Create account' }}
        </BaseButton>

        <p class="text-center text-sm text-gray-600">
          Already have an account?
          <RouterLink
            :to="{ name: 'login' }"
            class="font-semibold text-brand-600 hover:text-brand-700"
          >
            Sign in
          </RouterLink>
        </p>
      </form>
    </div>
  </main>
</template>
