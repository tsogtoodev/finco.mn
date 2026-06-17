<script setup lang="ts">
// Switches locale while preserving the current route via i18n's resolver.
const { locale, locales, setLocale } = useI18n()

const available = computed(() =>
  (locales.value as Array<{ code: string; name?: string }>).filter(
    (l) => l.code !== locale.value,
  ),
)
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <button
      v-for="l in available"
      :key="l.code"
      type="button"
      class="rounded px-2 py-1 text-muted transition-colors hover:text-brand-600"
      @click="setLocale(l.code)"
    >
      {{ l.name ?? l.code }}
    </button>
  </div>
</template>
