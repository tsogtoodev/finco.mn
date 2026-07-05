<script setup lang="ts">
// Circular icon button — carousel prev/next arrows (Figma 1:14212/1:14214).
// `direction` flips the shared arrow glyph; `tone` adapts to dark/light sections.
withDefaults(
  defineProps<{
    direction?: 'prev' | 'next'
    tone?: 'dark' | 'light'
    label: string
    disabled?: boolean
  }>(),
  { direction: 'next', tone: 'light' },
)
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :disabled="disabled"
    class="flex size-11 items-center justify-center rounded-full shadow-[0_0_20px_rgba(0,0,0,0.15)] transition duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-[0.94] active:blur-[1.5px] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
    :class="tone === 'dark'
      ? 'bg-[#f2f2f2]/10 text-white'
      : 'bg-[#f2f2f2]/10 text-dark'"
  >
    <Icon
      name="f:arrow-right"
      class="text-[28px]"
      :class="{ '-scale-x-100': direction === 'prev' }"
    />
  </button>
</template>
