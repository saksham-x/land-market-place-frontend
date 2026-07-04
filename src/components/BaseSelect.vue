<script setup lang="ts">
defineProps<{
  id: string
  label: string
  options: { value: string; label: string }[]
  error?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-sm font-medium text-gray-700">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <select
      :id="id"
      v-model="model"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="block w-full rounded-lg border bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:ring-2 focus:ring-brand-500/40"
      :class="
        error
          ? 'border-red-400 focus:border-red-500'
          : 'border-gray-300 focus:border-brand-500'
      "
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
