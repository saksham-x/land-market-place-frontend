<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'error' | 'success' | 'info'
    message: string
  }>(),
  { variant: 'error' },
)

const variantClasses: Record<'error' | 'success' | 'info', string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-brand-50 text-brand-800 border-brand-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
}
</script>

<template>
  <div
    role="alert"
    class="rounded-lg border px-4 py-3 text-sm"
    :class="variantClasses[variant]"
  >
    {{ message }}
  </div>
</template>
