<script setup lang="ts">
// Home — assembled from section components, data-driven via @nuxt/content.
// The Beep hero is a dark image hero, so opt into the transparent overlay nav.
definePageMeta({ transparentHeader: true })

const { locale } = useI18n()

const page = await usePageContent('home')

const { data: products } = await useAsyncData(
  () => `home-products-${locale.value}`,
  () =>
    queryCollection('products')
      .where('locale', '=', locale.value)
      .order('order', 'ASC')
      .all(),
  { watch: [locale] },
)

const { data: news } = await useAsyncData(
  () => `home-news-${locale.value}`,
  () =>
    queryCollection('news')
      .where('locale', '=', locale.value)
      .order('publishedAt', 'DESC')
      .limit(3)
      .all(),
  { watch: [locale] },
)

useSeoMeta({
  title: () => page.value?.hero?.headline ?? 'finco.design',
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <HeroBeep />
    <ValuePropRow :value="page?.valueProps" />
    <StatStrip :heading="page?.statsHeading" :stats="page?.stats" />
    <ProductHighlights :products="products ?? []" />
    <ShowcasePanel v-for="(s, i) in page?.showcases ?? []" :key="i" :showcase="s" />
    <NewsGrid :items="news ?? []" />
    <CtaBanner :cta="page?.cta" />
  </div>
</template>
