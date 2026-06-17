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

      <MotionReveal :delay="0.1" class="mt-12">
        <ProductCarousel :label="t('nav.news')">
          <NewsCard
            v-for="n in items"
            :key="n.slug"
            :title="n.title"
            :excerpt="n.excerpt"
            :image="n.image"
            :to="n.to"
            class="w-[300px] shrink-0 snap-start sm:w-[408px]"
          />
        </ProductCarousel>
      </MotionReveal>
    </div>
  </section>
</template>
