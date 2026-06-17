<script setup lang="ts">
// Language toggle: a pill with a globe + the *other* locale's code (EN/MN).
// Clicking swaps locale while preserving the current route via i18n's resolver.
// `variant` restyles it for the white-on-dark overlay nav vs the dark-on-light
// solid nav (Figma nodes 1:2623 / 1:13509).
withDefaults(defineProps<{ variant?: 'solid' | 'overlay' }>(), {
  variant: 'solid',
})

const { locale, locales, setLocale } = useI18n()

// Only two locales, so "other" is the single target we switch to.
const other = computed(() =>
  (locales.value as Array<{ code: string }>).find((l) => l.code !== locale.value),
)
</script>

<template>
  <button
    v-if="other"
    type="button"
    class="flex items-center gap-2 rounded-full py-2 pl-2 pr-3 text-sm font-normal transition-colors"
    :class="
      variant === 'overlay'
        ? 'bg-white/10 text-white hover:bg-white/20'
        : 'bg-black/5 text-dark hover:bg-black/10'
    "
    :aria-label="`Switch language to ${other.code.toUpperCase()}`"
    @click="setLocale(other.code)"
  >
    <svg viewBox="0 0 20 20" class="size-5 shrink-0" fill="none" aria-hidden="true">
      <path
        d="M18.3332 9.99984C18.3332 14.6022 14.6022 18.3332 9.99984 18.3332M18.3332 9.99984C18.3332 5.39746 14.6022 1.6665 9.99984 1.6665M18.3332 9.99984C18.3332 8.61912 14.6022 7.49984 9.99984 7.49984C5.39746 7.49984 1.6665 8.61912 1.6665 9.99984M18.3332 9.99984C18.3332 11.3805 14.6022 12.4998 9.99984 12.4998C5.39746 12.4998 1.6665 11.3805 1.6665 9.99984M9.99984 18.3332C5.39746 18.3332 1.6665 14.6022 1.6665 9.99984M9.99984 18.3332C11.8408 18.3332 13.3332 14.6022 13.3332 9.99984C13.3332 5.39746 11.8408 1.6665 9.99984 1.6665M9.99984 18.3332C8.15889 18.3332 6.6665 14.6022 6.6665 9.99984C6.6665 5.39746 8.15889 1.6665 9.99984 1.6665M1.6665 9.99984C1.6665 5.39746 5.39746 1.6665 9.99984 1.6665"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>
    <span class="leading-none">{{ other.code.toUpperCase() }}</span>
  </button>
</template>
