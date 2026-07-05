<script setup lang="ts">
// "Санал болгох бусад бүтээгдэхүүн" (Figma 1:14686). Heading + horizontal
// ProductCarousel (scroll-snap track, prev/next IconButtons + teal progress bar)
// of title+description ProductCards. Shared by the product- and service-detail
// pages. Items are type-agnostic (products OR services); `basePath` builds each
// card's link (/products or /services) so the same carousel serves both.
type RelatedItem = { slug: string; title: string; summary?: string; heroImage?: string }
withDefaults(
  defineProps<{ items?: RelatedItem[]; heading?: string; basePath?: string }>(),
  { basePath: '/products' },
)
const { t } = useI18n()
</script>

<template>
  <section v-if="items?.length" class="mx-auto max-w-7xl px-4 py-16 sm:py-20">
    <MotionReveal>
      <h2 class="font-display text-2xl font-regular tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {{ heading || t('related.heading') }}
      </h2>
    </MotionReveal>
    <ProductCarousel class="mt-10" :label="heading || t('related.heading')">
      <ProductCard
        v-for="p in items"
        :key="p.slug"
        :title="p.title"
        :summary="p.summary"
        :image="p.heroImage"
        :to="`${basePath}/${p.slug}`"
        class="w-[300px] shrink-0 snap-start"
      />
    </ProductCarousel>
  </section>
</template>
