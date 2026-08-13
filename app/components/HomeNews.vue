<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { t, locale } = useI18n()

const provider = useCmsProvider()
const { data: articles } = await useAsyncData(
  () => `news-home-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['news'][]>('news', { locale: locale.value, limit: 5 })
      : queryCollection('news')
          .where('locale', '=', locale.value)
          .order('publishedAt', 'DESC')
          .limit(5)
          .all(),
  { watch: [locale], default: () => [] },
)

const items = computed(() =>
  (articles.value ?? []).map((n) => ({
    slug: n.slug,
    title: n.title,
    excerpt: n.summary,
    image: n.image,
    to: n.to ?? `/news/${n.slug}`,
  })),
)
</script>

<template>
  <section class="bg-white py-24 lg:py-28 lg:pt-[80px]">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex items-center justify-between gap-[8px]">
        <h2 class="font-display text-2xl font-normal leading-tight text-[#141414] sm:text-[28px]">
          {{ t('nav.news') }}
        </h2>
        <AppButton to="/news" variant="accent" pill arrow class="shrink-0">
          {{ t('common.learnMore') }}
        </AppButton>
      </MotionReveal>
    </div>

    <div class="mt-12" :style="{ '--carousel-edge': 'max(1.5rem, calc((100vw - 1200px) / 2 + 1.5rem))' }">
      <MotionReveal :delay="0.1">
        <HomeNewsCarousel :items="items" :label="t('nav.news')" />
      </MotionReveal>
    </div>
  </section>
</template>
