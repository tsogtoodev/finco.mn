<script setup lang="ts">
// Trust service detail — PageHero + body + related + FAQ.
const route = useRoute()
const { locale, t } = useI18n()
const slug = computed(() => route.params.slug as string)

const { data: service } = await useAsyncData(
  () => `service-${locale.value}-${slug.value}`,
  () =>
    queryCollection('services')
      .where('locale', '=', locale.value)
      .where('slug', '=', slug.value)
      .first(),
  { watch: [locale, slug] },
)

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Service not found', fatal: true })
}

const { data: related } = await useAsyncData(
  () => `service-related-${locale.value}-${slug.value}`,
  () => {
    const slugs = service.value?.related ?? []
    if (!slugs.length) return Promise.resolve([])
    return queryCollection('products')
      .where('locale', '=', locale.value)
      .where('slug', 'IN', slugs)
      .all()
  },
  { watch: [locale, slug] },
)

useSeoMeta({
  title: () => service.value?.title,
  description: () => service.value?.summary,
})
</script>

<template>
  <div v-if="service">
    <PageHero
      :title="service.title"
      :subtitle="service.summary"
      :breadcrumb="[{ label: t('nav.home'), to: '/' }, { label: service.title }]"
    />

    <article v-if="service.body" class="mx-auto max-w-3xl px-4 py-12">
      <ContentRenderer :value="service" class="prose max-w-none" />
    </article>

    <RelatedProductsCarousel :products="related ?? []" />
    <FaqAccordion :items="service.faq" />
  </div>
</template>
