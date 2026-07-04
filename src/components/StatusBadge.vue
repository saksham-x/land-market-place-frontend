<script setup lang="ts">
import { computed } from 'vue'
import type { ListingStatus } from '@/types'
import { statusMeta } from '@/utils/listing'

const props = defineProps<{ status: ListingStatus }>()

const meta = computed(() => statusMeta(props.status))
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
    :class="meta.badge"
  >
    {{ meta.label }}
  </span>
</template>
