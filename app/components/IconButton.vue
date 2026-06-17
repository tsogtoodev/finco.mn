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
    class="flex size-11 items-center justify-center rounded-full shadow-[0_0_20px_rgba(0,0,0,0.15)] transition disabled:cursor-not-allowed disabled:opacity-40"
    :class="tone === 'dark'
      ? 'bg-white/10 text-white hover:bg-white/20'
      : 'bg-black/[0.04] text-foreground hover:bg-black/[0.08]'"
  >
    <Icon
      name="f:arrow-right"
      class="size-7"
      :class="{ '-scale-x-100': direction === 'prev' }"
    />
  </button>
</template>
