<script setup lang="ts">
// Individual products catalog.
const { locale } = useI18n()

const page = await usePageContent('products')

const { data: products } = await useAsyncData(
  () => `products-individual-${locale.value}`,
  () =>
    queryCollection('products')
      .where('locale', '=', locale.value)
      .where('audience', '=', 'individual')
      .order('order', 'ASC')
      .all(),
  { watch: [locale] },
)

useSeoMeta({
  title: () => page.value?.hero?.headline,
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <PageHero
      :eyebrow="page?.hero?.eyebrow"
      :title="page?.hero?.headline"
      :subtitle="page?.hero?.subheadline"
    >
      <AudienceToggle active="individual" />
    </PageHero>

    <div class="mx-auto max-w-7xl px-4 py-16">
      <ProductCardGrid :products="products ?? []" />
    </div>

    <FaqAccordion :items="page?.faq" />
  </div>
</template>
