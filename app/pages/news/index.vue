<script setup lang="ts">
// News index — backs the "Мэдээ мэдээлэл" nav item. Overlay nav over a dark hero.
definePageMeta({ transparentHeader: true })

const { locale, t } = useI18n()

const { data: news } = await useAsyncData(
  () => `news-index-${locale.value}`,
  () =>
    queryCollection('news')
      .where('locale', '=', locale.value)
      .order('publishedAt', 'DESC')
      .all(),
  { watch: [locale] },
)

useSeoMeta({ title: () => t('nav.news') })
</script>

<template>
  <div>
    <PageHero dark :title="t('nav.news')" />

    <section class="mx-auto max-w-7xl px-4 py-16">
      <div v-if="news?.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NewsCard v-for="n in news" :key="n.slug" :item="n" />
      </div>
      <p v-else class="py-10 text-center text-muted-foreground">—</p>
    </section>
  </div>
</template>
