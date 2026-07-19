<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Legal / policy page — renders a `legal` collection doc (markdown body) at
// /legal/[slug] (terms, privacy). Dark PageHero + a narrow prose column, mirror
// of the news article page. 404s when the slug/locale pair is missing.
const { locale, t } = useI18n()
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const provider = useCmsProvider()
const { data: doc } = await useAsyncData(
  () => `legal-${slug.value}-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['legal'] | null>('legal', { locale: locale.value, slug: slug.value })
      : queryCollection('legal')
          .where('locale', '=', locale.value)
          .where('slug', '=', slug.value)
          .first(),
  { watch: [locale, slug] },
)

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const updated = computed(() => {
  if (!doc.value?.updatedAt) return ''
  return new Intl.DateTimeFormat(locale.value === 'mn' ? 'mn-MN' : 'en-US', {
    dateStyle: 'long',
  }).format(new Date(doc.value.updatedAt))
})

useSeoMeta({
  title: () => doc.value?.title,
  description: () => doc.value?.summary,
})
</script>

<template>
  <div v-if="doc">
    <PageHero dark :title="doc.title" />

    <article class="mx-auto w-full max-w-[840px] px-6 py-16">
      <p v-if="updated" class="text-sm font-light text-black/50">
        {{ t('legal.updated') }} {{ updated }}
      </p>

      <p v-if="doc.summary" class="mt-6 text-lg font-light leading-8 text-black/70">
        {{ doc.summary }}
      </p>

      <ContentRenderer
        :value="doc"
        class="prose prose-neutral mt-8 max-w-none font-light prose-headings:font-display prose-headings:font-medium prose-p:leading-7 prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-foreground"
      />
    </article>
  </div>
</template>
