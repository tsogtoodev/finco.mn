<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Trust service detail — PageHero + body + related + FAQ.
definePageMeta({ transparentHeader: true })

const route = useRoute()
const { locale } = useI18n()
const slug = computed(() => route.params.slug as string)
const provider = useCmsProvider()

const { data: service } = await useAsyncData(
  () => `service-${locale.value}-${slug.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['services'] | null>('services', { locale: locale.value, slug: slug.value })
      : queryCollection('services')
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
  async () => {
    // Related = the OTHER trust services, ordered like the catalog, current
    // one excluded.
    const items =
      provider === 'directus'
        ? await fetchCms<Collections['services'][]>('services', { locale: locale.value })
        : await queryCollection('services')
            .where('locale', '=', locale.value)
            .order('order', 'ASC')
            .all()
    return items.filter((s) => s.slug !== slug.value)
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

    <RelatedProductsCarousel :items="related ?? []" base-path="/services" />
    <FaqAccordion :items="service.faq" />
  </div>
</template>
