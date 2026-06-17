<script setup lang="ts">
// One template for both products listing routes (/products = individual,
// /business = business). The audience prop drives the hero photo + toggle, the
// intro tagline, the card set and (shared) FAQ. Build once, never two pages.
import type { Audience } from '~/data/productListing'

const props = defineProps<{ audience: Audience }>()
const { tm, rt } = useI18n()

// FAQ items are an i18n array of { question, answer } message objects → resolve
// each with rt() so SSR and locale switches stay reactive.
const faqItems = computed(() =>
  (tm('productsPage.faq') as { question: string; answer: string }[]).map((it) => ({
    question: rt(it.question),
    answer: rt(it.answer),
  })),
)
</script>

<template>
  <div>
    <ProductsHero :audience="props.audience" />
    <ProductsIntro :audience="props.audience" />
    <ProductGrid :audience="props.audience" />
    <FaqAccordion :items="faqItems" />
  </div>
</template>
