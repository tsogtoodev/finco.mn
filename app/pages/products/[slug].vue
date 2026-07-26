<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Product detail — (locale, slug) query + batched related lookup.
definePageMeta({ transparentHeader: true })

const route = useRoute()
const { locale, t } = useI18n()
const slug = computed(() => route.params.slug as string)
const provider = useCmsProvider()

const { data: product } = await useAsyncData(
  () => `product-${locale.value}-${slug.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['products'] | null>('products', { locale: locale.value, slug: slug.value })
      : queryCollection('products')
          .where('locale', '=', locale.value)
          .where('slug', '=', slug.value)
          .first(),
  { watch: [locale, slug] },
)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

const { data: related } = await useAsyncData(
  () => `product-related-${locale.value}-${slug.value}`,
  async () => {
    const audience = product.value?.audience
    if (!audience) return []
    // Related = other products of the SAME audience (business ↔ business,
    // individual ↔ individual), ordered like the catalog, current one excluded.
    const items =
      provider === 'directus'
        ? (await fetchCms<Collections['products'][]>('products', { locale: locale.value })).filter(
            (p) => p.audience === audience,
          )
        : await queryCollection('products')
            .where('locale', '=', locale.value)
            .where('audience', '=', audience)
            .order('order', 'ASC')
            .all()
    return items.filter((p) => p.slug !== slug.value)
  },
  { watch: [locale, slug] },
)

const audienceCrumb = computed(() =>
  product.value?.audience === 'business'
    ? { label: t('nav.business'), to: '/business' }
    : { label: t('nav.products'), to: '/products' },
)

useSeoMeta({
  title: () => product.value?.title,
  description: () => product.value?.summary,
})
</script>

<template>
  <div v-if="product">
    <ProductDetailHero
      :image="product.heroImage"
      :title="product.title"
      :subtitle="product.summary"
      :terms="product.loanTerms"
      :breadcrumb="[{ label: t('common.homeBreadcrumb'), to: '/' }, audienceCrumb, { label: product.title }]"
    />

    <section class="bg-white py-[20px]">
      <div class="mx-auto max-w-7xl px-4">
        <DetailTabs :tabs="product.tabs ?? {}" :body="product.body" />
      </div>
    </section>

    <RelatedProductsCarousel :items="related ?? []" />
    <FaqAccordion :items="product.faq" />
    <ProductContactCta />
  </div>
</template>
