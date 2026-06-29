<script setup lang="ts">
// Product detail — (locale, slug) query + batched related lookup.
definePageMeta({ transparentHeader: true })

const route = useRoute()
const { locale, t } = useI18n()
const slug = computed(() => route.params.slug as string)

const { data: product } = await useAsyncData(
  () => `product-${locale.value}-${slug.value}`,
  () =>
    queryCollection('products')
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
  () => {
    const slugs = product.value?.related ?? []
    if (!slugs.length) return Promise.resolve([])
    return queryCollection('products')
      .where('locale', '=', locale.value)
      .where('slug', 'IN', slugs)
      .all()
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
      :eyebrow="audienceCrumb.label"
      :title="product.title"
      :subtitle="product.summary"
      :terms="product.loanTerms"
      :breadcrumb="[{ label: t('common.homeBreadcrumb'), to: '/' }, audienceCrumb, { label: product.title }]"
    />

    <section class="bg-white py-16 sm:py-20">
      <div class="mx-auto max-w-7xl px-4">
        <DetailTabs :tabs="product.tabs ?? {}" :body="product.body" />
      </div>
    </section>

    <RelatedProductsCarousel :products="related ?? []" />
    <FaqAccordion :items="product.faq" />
  </div>
</template>
