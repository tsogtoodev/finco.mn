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

// Toggle accent follows the active product line: teal for Beep/individual
// (Иргэнд), blurple for business (Бизнест). The business-active state in Figma
// (340:8039) uses --color-accent #4c41d8 for the pill and its 10% tint for the
// bar — rgba(76, 65, 216, 0.1).
const tabTheme = computed(() =>
  audience.value === 'business'
    ? { bar: 'rgba(76, 65, 216, 0.1)', pill: 'var(--color-accent)' }
    : { bar: 'rgba(19, 207, 185, 0.1)', pill: 'var(--color-teal)' },
)

// Heading, accent and subtext swap with the active audience (Figma 238:9708
// individual, 340:8034 business).
const isBusiness = computed(() => audience.value === 'business')
const heading = computed(() =>
  t(isBusiness.value ? 'home.products.businessHeading' : 'home.products.heading'),
)
const headingAccent = computed(() =>
  t(isBusiness.value ? 'home.products.businessHeadingAccent' : 'home.products.headingAccent'),
)
const subtext = computed(() =>
  t(isBusiness.value ? 'home.products.businessSubtext' : 'home.products.subtext'),
)

// BlurText per-word reveal, staggered across the three blocks: the dark heading
// runs first, the colour accent picks up where it ends, then the subtext — each
// block's `startDelay` continues the previous block's word cadence.
const TITLE_WORD_MS = 45
const TITLE_START = 0.05
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const accentStart = computed(() => TITLE_START + (wordCount(heading.value) * TITLE_WORD_MS) / 1000)
const subtextStart = computed(
  () => accentStart.value + (wordCount(headingAccent.value) * TITLE_WORD_MS) / 1000 + 0.06,
)
</script>

<template>
  <section class="bg-[#fdfffe] py-24 lg:py-32">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <div class="flex flex-col items-center gap-3 text-center">
        <!-- Title blur-reveals word-by-word; the accent half continues the
             stagger and keeps its teal/blurple colour. -->
        <h2 class="flex w-full flex-wrap items-baseline justify-center gap-x-[0.28em] font-display text-3xl font-bold leading-tight text-[#231f20] sm:text-4xl">
          <BlurText
            :key="audience"
            :text="heading.trim()"
            as="span"
            animate-by="words"
            :delay="TITLE_WORD_MS"
            :start-delay="TITLE_START"
            class="justify-center"
          />
          <BlurText
            :key="audience"
            :text="headingAccent"
            as="span"
            animate-by="words"
            :delay="TITLE_WORD_MS"
            :start-delay="accentStart"
            class="justify-center transition-colors duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            :style="{ color: tabTheme.pill }"
          />
        </h2>
        <BlurText
          :key="audience"
          :text="subtext"
          as="p"
          animate-by="words"
          :delay="18"
          :start-delay="subtextStart"
          class="w-full justify-center text-base font-light leading-relaxed text-[#231f20]/60"
        />

        <!-- Audience toggle (filters the carousel) — sliding pill -->
        <MotionReveal :delay="0.2" class="mt-9">
        <TabPills
          :model-value="audience"
          :tabs="options.map((o) => ({ value: o.key, label: o.label }))"
          :aria-label="t('home.products.heading')"
          :style="{
            '--tabs-bar-bg': tabTheme.bar,
            '--tabs-pill-bg': tabTheme.pill,
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
      </div>
    </div>

    <!-- Full-bleed carousel: the heading + controls stay in the 1200 column while
         the card track scrolls edge-to-edge. --carousel-edge aligns the first/last
         card (and the controls) to the heading column. -->
    <div class="mt-12" :style="{ '--carousel-edge': 'max(1.5rem, calc((100vw - 1200px) / 2 + 1.5rem))' }">
      <MotionReveal :delay="0.1">
        <HomeProductsCarousel :products="products" :label="t('home.products.heading')" />
      </MotionReveal>
    </div>
  </section>
</template>
