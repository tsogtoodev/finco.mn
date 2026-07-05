<script setup lang="ts">
// Segmented Иргэнд / Бизнест switch pinned in the products hero. Each side is a
// localized link to /products vs /business, so the audience swap is a real route
// change (correct under the i18n locale prefix). Active pill matches the audience
// brand: teal for individuals, blurple (accent) for business — per Figma 1:13616.
import type { Audience } from '~/composables/useProducts'

defineProps<{ audience: Audience }>()
const { t } = useI18n()
const localePath = useLocalePath()

const options = [
  { key: 'individual', labelKey: 'nav.products', to: '/products' },
  { key: 'business', labelKey: 'nav.business', to: '/business' },
] as const
</script>

<template>
  <div
    role="tablist"
    class="inline-flex items-center gap-1 rounded-[var(--radius)] p-1.5 backdrop-blur-sm"
    :class="audience === 'individual' ? 'bg-teal/10' : 'bg-accent/10'"
  >
    <NuxtLink
      v-for="o in options"
      :key="o.key"
      :to="localePath(o.to)"
      role="tab"
      :aria-selected="o.key === audience"
      class="rounded-[var(--radius)] px-6 py-1.5 text-base font-medium transition-colors sm:text-lg"
      :class="
        o.key === audience
          ? audience === 'individual'
            ? 'bg-teal text-white'
            : 'bg-accent text-white'
          : 'font-light text-white/80 hover:text-white'
      "
    >
      {{ t(o.labelKey) }}
    </NuxtLink>
  </div>
</template>
