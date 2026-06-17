<script setup lang="ts">
// Segmented Иргэнд / Бизнест switch — navigates between /products and /business.
// `active` marks which side is current.
defineProps<{ active: 'individual' | 'business' }>()
const { t } = useI18n()
const localePath = useLocalePath()

const options = computed(() => [
  { key: 'individual', label: t('nav.products'), to: '/products' },
  { key: 'business', label: t('nav.business'), to: '/business' },
])
</script>

<template>
  <div class="mt-8 inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">
    <NuxtLink
      v-for="o in options"
      :key="o.key"
      :to="localePath(o.to)"
      class="rounded-full px-5 py-2 text-sm font-medium transition-colors"
      :class="o.key === active ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'"
    >
      {{ o.label }}
    </NuxtLink>
  </div>
</template>
