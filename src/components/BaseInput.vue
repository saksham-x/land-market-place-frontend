<script setup lang="ts">
defineProps<{
  id: string
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  error?: string
  required?: boolean
}>()

// Two-way bound value (Vue 3.4+ defineModel).
const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-sm font-medium text-gray-700">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:ring-2 focus:ring-brand-500/40"
      :class="
        error
          ? 'border-red-400 focus:border-red-500'
          : 'border-gray-300 focus:border-brand-500'
      "
    />
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
