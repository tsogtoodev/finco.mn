<script setup lang="ts">
import { homeProducts } from '~/data/homeProducts'

// Product solutions (Figma 1:14174): heading + subtext + Иргэнд/Бизнест toggle
// that filters a product-card carousel in place. (The products *pages* use the
// shared navigating AudienceToggle; here the toggle filters, so it's local.)
const { t, locale } = useI18n()
const localePath = useLocalePath()

const audience = ref<'individual' | 'business'>('individual')

const options = computed(() => [
  { key: 'individual' as const, label: t('nav.products') },
  { key: 'business' as const, label: t('nav.business') },
])

const products = computed(() =>
  (homeProducts[locale.value as 'mn' | 'en'] ?? homeProducts.mn).filter(
    (p) => p.audience === audience.value,
  ),
)
</script>

<template>
  <section class="bg-[#fdfffe] py-24 lg:py-32">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-center gap-3 text-center">
        <h2 class="font-display text-3xl font-bold leading-tight text-[#231f20] sm:text-4xl">
          {{ t('home.products.heading') }}<span class="text-teal">{{ t('home.products.headingAccent') }}</span>
        </h2>
        <p class="text-base font-light leading-relaxed text-[#231f20]/60">
          {{ t('home.products.subtext') }}
        </p>

        <!-- Audience toggle (filters the carousel) — sliding pill -->
        <TabPills
          class="mt-9"
          :model-value="audience"
          :tabs="options.map((o) => ({ value: o.key, label: o.label }))"
          :aria-label="t('home.products.heading')"
          :style="{
            '--tabs-bar-bg': 'rgba(19, 207, 185, 0.1)',
            '--tabs-pill-bg': 'var(--color-teal)',
            '--tabs-text-muted': 'rgba(26, 26, 26, 0.8)',
            '--tabs-text-active': '#ffffff',
            '--tabs-text-hover': 'var(--color-foreground)',
            '--tabs-radius': '9999px',
            '--tabs-pad': '6px',
            '--tabs-tab-h': '44px',
            '--tabs-tab-px': '32px',
            '--tabs-font': '18px',
            '--tabs-weight': '300',
            '--tabs-weight-active': '500',
          }"
          @update:model-value="(v) => (audience = v as 'individual' | 'business')"
        />
      </MotionReveal>

      <MotionReveal :delay="0.1" class="mt-12">
        <ProductCarousel :label="t('home.products.heading')">
          <ProductCard
            v-for="p in products"
            :key="p.slug"
            :title="p.title"
            :summary="p.summary"
            :image="p.image"
            :to="`/products/${p.slug}`"
            class="h-[460px] w-[300px] shrink-0 snap-start sm:w-[340px]"
          />
        </ProductCarousel>
      </MotionReveal>
    </div>
  </section>
</template>
