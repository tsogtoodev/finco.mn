<script setup lang="ts">
// News (Figma 1:14236): heading + "Дэлгэрэнгүй" CTA, then a news-card carousel.
// Cards are the latest articles from the `news` collection, so publishing in
// /content (Studio) updates the homepage automatically.
const { t, locale } = useI18n()

const { data: articles } = await useAsyncData(
  () => `news-home-${locale.value}`,
  () =>
    queryCollection('news')
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
    // doc field is `summary` (`excerpt` is reserved on page-type collections)
    excerpt: n.summary,
    image: n.image,
    to: n.to ?? `/news/${n.slug}`,
  })),
)
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
