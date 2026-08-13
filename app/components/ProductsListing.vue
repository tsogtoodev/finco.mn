<script setup lang="ts">
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const { tm, rt } = useI18n()

const page = await usePageContent(props.audience === 'individual' ? 'products' : 'business')

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
    <ProductContactCta />
  </div>
</template>
