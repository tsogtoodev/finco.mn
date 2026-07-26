<script setup lang="ts">
// Segmented Иргэнд / Бизнест switch pinned in the products hero — the same
// sliding-pill TabPills used by the HomeProducts toggle, themed per audience
// (teal pill for individuals, blurple accent for business, matching Figma
// 1:13616 / the HomeProducts accent rules). Unlike HomeProducts (which
// filters in place), selecting here NAVIGATES: /products vs /business is a
// real route change (correct under the i18n locale prefix).
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const { t } = useI18n()
const localePath = useLocalePath()

const options = [
  { key: 'individual', labelKey: 'nav.products', to: '/products' },
  { key: 'business', labelKey: 'nav.business', to: '/business' },
] as const

const tabs = computed(() =>
  options.map((o) => ({ value: o.key as string, label: t(o.labelKey) })),
)

// Bar tint + pill colour follow the active audience (10% brand tint bar, solid
// brand pill — same scheme as the HomeProducts toggle).
const tabTheme = computed(() =>
  props.audience === 'business'
    ? { bar: 'rgba(76, 65, 216, 0.18)', pill: 'var(--color-accent)' }
    : { bar: 'rgba(19, 207, 185, 0.18)', pill: 'var(--color-teal)' },
)

function onSelect(value: string) {
  const target = options.find((o) => o.key === value)
  if (target && target.key !== props.audience) navigateTo(localePath(target.to))
}
</script>

<template>
  <TabPills
    :model-value="audience"
    :tabs="tabs"
    :aria-label="t('productsPage.headline')"
    class="backdrop-blur-sm"
    :style="{
      '--tabs-bar-bg': tabTheme.bar,
      '--tabs-pill-bg': tabTheme.pill,
      '--tabs-text-muted': 'rgba(255, 255, 255, 0.8)',
      '--tabs-text-active': '#ffffff',
      '--tabs-text-hover': '#ffffff',
      '--tabs-radius': '9999px',
      '--tabs-pad': '6px',
      '--tabs-tab-h': '44px',
      '--tabs-tab-px': '32px',
      '--tabs-font': '18px',
      '--tabs-weight': '300',
      '--tabs-weight-active': '500',
    }"
    @update:model-value="onSelect"
  />
</template>
