<script setup lang="ts">
// Features bento (Figma 1:14123): heading + subtext, then a bento grid —
// one tall card on the left, two stacked cards on the right. Copy comes from
// the `pages` home doc's valueProps (i18n fallback); the blob art + layout
// stay component-side, paired to items by index.
const { t } = useI18n()

const page = await usePageContent('home')

const CARD_CHROME = [
  { image: '/images/home/feature-blob-1.png', class: 'lg:row-span-2 lg:min-h-[533px]' },
  { image: '/images/home/feature-blob-2.png', class: '' },
  { image: '/images/home/feature-blob-3.png', class: '' },
]

const vp = computed(() => page.value?.valueProps)
const heading = computed(() => vp.value?.heading ?? t('home.features.heading'))
const headingAccent = computed(() => vp.value?.accent ?? t('home.features.headingAccent'))
const subtext = computed(() => vp.value?.subheading ?? t('home.features.subtext'))

const cards = computed(() => {
  const items =
    vp.value?.items ??
    (['fast', 'secure', 'smart'] as const).map((k) => ({
      title: t(`home.features.${k}.title`),
      body: t(`home.features.${k}.body`),
    }))
  return items.slice(0, 3).map((it, i) => ({ ...it, ...CARD_CHROME[i] }))
})
</script>

<template>
  <section class="bg-[#fcfcff] py-[60px] lg:pb-[120px]">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-center gap-5 text-center">
        <h2 class="font-display text-3xl font-medium leading-tight text-[#141414] sm:text-4xl">
          {{ heading }}<span class="text-accent">{{ headingAccent }}</span>
        </h2>
        <p class="max-w-[702px] text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
          {{ subtext }}
        </p>
      </MotionReveal>

      <div class="mt-16 grid gap-6 lg:grid-cols-[453.33fr_722.67fr] lg:grid-rows-2">
        <MotionReveal
          v-for="(c, i) in cards"
          :key="i"
          :delay="0.1 + i * 0.12"
          :class="c.class"
        >
          <FeatureCard
            :title="c.title"
            :body="c.body"
            :image="c.image"
            class="h-full"
          />
        </MotionReveal>
      </div>
    </div>
  </section>
</template>
