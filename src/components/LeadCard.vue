<script setup lang="ts">
import type { Lead } from '@/types'
import { buyerName, buyerEmail } from '@/utils/contact'
import { formatDate } from '@/utils/format'

defineProps<{ lead: Lead; listingTitle?: string }>()
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-semibold text-gray-900">{{ buyerName(lead) }}</p>
        <a
          v-if="buyerEmail(lead)"
          :href="`mailto:${buyerEmail(lead)}`"
          class="text-sm text-brand-600 hover:text-brand-700"
        >
          {{ buyerEmail(lead) }}
        </a>
      </div>
      <span class="shrink-0 text-xs text-gray-400">
        {{ formatDate(lead.createdAt) }}
      </span>
    </div>
    <p v-if="listingTitle" class="mt-1 text-xs text-gray-400">
      On: {{ listingTitle }}
    </p>
    <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
      {{ lead.message }}
    </p>
  </div>
</template>
