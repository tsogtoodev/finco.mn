<script setup lang="ts">
// Trust service detail — PageHero + body + related + FAQ.
definePageMeta({ transparentHeader: true })

const route = useRoute()
const { locale } = useI18n()
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
    <ServiceHero
      :image="service.heroImage"
      :title="service.title"
      :subtitle="service.summary"
      :breadcrumb-current="service.breadcrumb || service.title"
    />

    <RelatedProductsCarousel :products="related ?? []" />
    <FaqAccordion :items="service.faq" />
  </div>
</template>
