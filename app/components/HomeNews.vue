<script setup lang="ts">
import { homeNews } from '~/data/homeNews'

// News (Figma 1:14236): heading + "Дэлгэрэнгүй" CTA, then a news-card carousel.
const { t, locale } = useI18n()

const items = computed(() => homeNews[locale.value as 'mn' | 'en'] ?? homeNews.mn)
</script>

<template>
  <section class="bg-[#fafafe] py-24 lg:py-28">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex items-center justify-between gap-4">
        <h2 class="font-display text-2xl font-normal leading-tight text-[#141414] sm:text-[32px]">
          {{ t('nav.news') }}
        </h2>
        <AppButton to="/news" variant="accent" pill arrow class="shrink-0">
          {{ t('common.learnMore') }}
        </AppButton>
      </MotionReveal>
    </div>

    <!-- Full-bleed spotlight carousel: heading + controls stay in the 1200 column
         while the card track scrolls edge-to-edge. --carousel-edge aligns the
         first/last card (and the controls) to the heading column. -->
    <div class="mt-12" :style="{ '--carousel-edge': 'max(1.5rem, calc((100vw - 1200px) / 2 + 1.5rem))' }">
      <MotionReveal :delay="0.1">
        <HomeNewsCarousel :items="items" :label="t('nav.news')" />
      </MotionReveal>
    </div>
  </section>
</template>
