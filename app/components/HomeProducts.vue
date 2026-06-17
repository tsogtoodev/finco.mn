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

        <!-- Audience toggle (filters the carousel) -->
        <div class="mt-9 inline-flex items-center rounded-full bg-teal/10 p-1.5" role="group" :aria-label="t('home.products.heading')">
          <button
            v-for="o in options"
            :key="o.key"
            type="button"
            :aria-pressed="audience === o.key"
            class="rounded-full px-8 py-2 text-lg transition-colors"
            :class="audience === o.key
              ? 'bg-teal font-medium text-white'
              : 'font-light text-[#1a1a1a]/80 hover:text-foreground'"
            @click="audience = o.key"
          >
            {{ o.label }}
          </button>
        </div>
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
