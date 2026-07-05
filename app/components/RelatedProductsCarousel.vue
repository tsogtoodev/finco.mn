<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// "Санал болгох бусад бүтээгдэхүүн" (Figma 1:14686). Heading + horizontal
// ProductCarousel (scroll-snap track, prev/next IconButtons + teal progress bar)
// of title+description ProductCards. Shared by the product- and service-detail pages.
defineProps<{ products?: Collections['products'][]; heading?: string }>()
const { t } = useI18n()
</script>

<template>
  <section v-if="products?.length" class="mx-auto max-w-7xl px-4 py-16 sm:py-20">
    <MotionReveal>
      <h2 class="font-display text-2xl font-regular tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {{ heading || t('related.heading') }}
      </h2>
    </MotionReveal>
    <ProductCarousel class="mt-10" :label="heading || t('related.heading')">
      <ProductCard
        v-for="p in products"
        :key="p.slug"
        :product="p"
        class="w-[300px] shrink-0 snap-start"
      />
    </ProductCarousel>
  </section>
</template>
