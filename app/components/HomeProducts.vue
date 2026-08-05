<script setup lang="ts">
const { t } = useI18n()

const audience = ref<'individual' | 'business'>('individual')

const options = computed(() => [
  { key: 'individual' as const, label: t('nav.products') },
  { key: 'business' as const, label: t('nav.business') },
])

const catalog = await useProductList()

const products = computed(() =>
  (catalog.value ?? [])
    .filter((p) => p.featured && p.audience === audience.value)
    .map((p) => ({
      slug: p.slug,
      audience: p.audience,
      title: p.title,
      summary: p.summary ?? '',
      image: p.cardImage ?? p.heroImage ?? '',
    })),
)

const tabTheme = computed(() =>
  audience.value === 'business'
    ? { bar: 'rgba(76, 65, 216, 0.1)', pill: 'var(--color-accent)' }
    : { bar: 'rgba(19, 207, 185, 0.1)', pill: 'var(--color-teal)' },
)

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

const TITLE_WORD_MS = 45
const TITLE_START = 0.05
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const accentStart = computed(() => TITLE_START + (wordCount(heading.value) * TITLE_WORD_MS) / 1000)
const subtextStart = computed(
  () => accentStart.value + (wordCount(headingAccent.value) * TITLE_WORD_MS) / 1000 + 0.06,
)
</script>

<template>
  <!-- `id` is load-bearing: index.vue pins HomeStats `sticky top-0` and scrolls
       this opaque panel over it, so the stats Spline scene reads this element to
       know when it is completely hidden and can stop rendering. -->
  <section id="home-products" class="bg-[#fdfffe] py-24 lg:py-32">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <div class="flex flex-col items-center gap-3 text-center">
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

    <div class="mt-12" :style="{ '--carousel-edge': 'max(1.5rem, calc((100vw - 1200px) / 2 + 1.5rem))' }">
      <MotionReveal :delay="0.1">
        <HomeProductsCarousel :products="products" :label="t('home.products.heading')" />
      </MotionReveal>
    </div>
  </section>
</template>
