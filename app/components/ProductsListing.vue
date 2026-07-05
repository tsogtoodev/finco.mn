<script setup lang="ts">
// One template for both products listing routes (/products = individual,
// /business = business). The audience prop drives the hero photo + toggle, the
// intro tagline, the card set and FAQ. Hero copy/photo + FAQ come from the
// `pages` collection (products/business docs) so editors manage them in
// /content; the card grid queries the products collection itself.
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const { tm, rt } = useI18n()

const page = await usePageContent(props.audience === 'individual' ? 'products' : 'business')

// FAQ from the page doc; falls back to the shared i18n set if the doc omits it.
const faqItems = computed(() => {
  if (page.value?.faq?.length) return page.value.faq
  return (tm('productsPage.faq') as { question: string; answer: string }[]).map((it) => ({
    question: rt(it.question),
    answer: rt(it.answer),
  }))
})
</script>

<template>
  <div>
    <ProductsHero
      :audience="props.audience"
      :photo="page?.hero?.image"
      :headline="page?.hero?.headline"
    />
    <ProductsIntro :audience="props.audience" />
    <ProductGrid :audience="props.audience" />
    <FaqAccordion :items="faqItems" />
  </div>
</template>
