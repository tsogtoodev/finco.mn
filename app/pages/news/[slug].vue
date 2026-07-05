<script setup lang="ts">
// News article page — renders a `news` collection doc (markdown body). No
// dedicated Figma design: dark PageHero (matching /news) + a narrow prose
// column, image on top, date + back link. 404s when the slug/locale pair is
// missing (same contract as the product/job detail pages).
const { locale, t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const { data: article } = await useAsyncData(
  () => `news-${slug.value}-${locale.value}`,
  () =>
    queryCollection('news')
      .where('locale', '=', locale.value)
      .where('slug', '=', slug.value)
      .first(),
  { watch: [locale, slug] },
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

const published = computed(() => {
  if (!article.value?.publishedAt) return ''
  return new Intl.DateTimeFormat(locale.value === 'mn' ? 'mn-MN' : 'en-US', {
    dateStyle: 'long',
  }).format(new Date(article.value.publishedAt))
})

useSeoMeta({
  title: () => article.value?.title ?? t('nav.news'),
  description: () => article.value?.summary,
})
</script>

<template>
  <div v-if="article">
    <PageHero dark :title="article.title" />

    <article class="mx-auto w-full max-w-[840px] px-6 py-16">
      <div class="flex items-center justify-between gap-4">
        <time :datetime="article.publishedAt" class="text-sm font-light text-black/50">
          {{ published }}
        </time>
        <NuxtLink
          :to="localePath('/news')"
          class="inline-flex items-center gap-1.5 text-sm font-light text-black/60 transition-colors hover:text-primary"
        >
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          {{ t('nav.news') }}
        </NuxtLink>
      </div>

      <div v-if="article.image" class="mt-8 overflow-hidden rounded-[var(--radius)] rounded-tr-[90px]">
        <NuxtImg
          :src="article.image"
          :alt="article.title"
          width="840"
          height="480"
          sizes="840px"
          class="w-full object-cover"
        />
      </div>

      <p v-if="article.summary" class="mt-10 text-lg font-light leading-8 text-black/70">
        {{ article.summary }}
      </p>

      <ContentRenderer
        :value="article"
        class="prose prose-neutral mt-8 max-w-none font-light prose-headings:font-display prose-p:leading-7 prose-p:text-black/70"
      />
    </article>
  </div>
</template>
