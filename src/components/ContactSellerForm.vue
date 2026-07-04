<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { sendInquiry } from '@/api/contact'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import BaseButton from '@/components/BaseButton.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import AlertBanner from '@/components/AlertBanner.vue'

const props = defineProps<{ listingId: string; sellerName?: string }>()

const route = useRoute()
const auth = useAuthStore()
const apiError = useApiError()

const message = ref('')
const loading = ref(false)
const sent = ref(false)
const clientError = ref<string | undefined>(undefined)

// OWNERSHIP NOTE: the public listing payload (BrowseListing) has NO sellerId, so
// we cannot reliably detect whether the current user owns this listing. Rather
// than guess, we let the backend reject a self-inquiry (400) and surface that
// error gracefully below. A future public payload exposing sellerId would let
// us hide the form for owners up-front.

function messageError(): string | undefined {
  return clientError.value ?? apiError.fieldError('message')
}

function validate(): boolean {
  const trimmed = message.value.trim()
  if (!trimmed) {
    clientError.value = 'Please enter a message.'
    return false
  }
  if (trimmed.length < 10) {
    clientError.value = 'Message must be at least 10 characters.'
    return false
  }
  clientError.value = undefined
  return true
}

async function onSubmit(): Promise<void> {
  apiError.clear()
  if (!validate()) return
  loading.value = true
  try {
    await sendInquiry(props.listingId, message.value.trim())
    sent.value = true
    message.value = ''
  } catch (err) {
    apiError.setError(err)
  } finally {
    loading.value = false
  }
}

function sendAnother(): void {
  sent.value = false
  apiError.clear()
  clientError.value = undefined
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
      Contact the seller
    </h2>

    <!-- Guest: prompt to log in, preserving the intended destination. -->
    <div v-if="!auth.isAuthenticated" class="mt-3">
      <p class="mb-3 text-sm text-gray-600">
        Log in to send a message{{ sellerName ? ` to ${sellerName}` : '' }}.
      </p>
      <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }">
        <BaseButton>Log in to contact the seller</BaseButton>
      </RouterLink>
    </div>

    <!-- Success confirmation -->
    <div v-else-if="sent" class="mt-3">
      <AlertBanner
        variant="success"
        message="Your inquiry has been sent. The seller can now reach out to you."
      />
      <button
        type="button"
        class="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
        @click="sendAnother"
      >
        Send another message
      </button>
    </div>

    <!-- Inquiry form -->
    <form v-else class="mt-3 space-y-3" novalidate @submit.prevent="onSubmit">
      <AlertBanner
        v-if="apiError.message.value"
        variant="error"
        :message="apiError.message.value"
      />
      <BaseTextarea
        id="inquiry-message"
        v-model="message"
        label="Your message"
        :rows="4"
        placeholder="Introduce yourself and ask about the property (min 10 characters)."
        required
        :error="messageError()"
      />
      <BaseButton type="submit" :loading="loading">Send inquiry</BaseButton>
    </form>
  </section>
</template>
