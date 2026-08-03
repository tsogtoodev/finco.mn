<script setup lang="ts">
// "Санал болгох бусад бүтээгдэхүүн" (Figma 1:14686). Heading + the same
// spotlight staircase carousel as the home products section: the active card is
// pinned largest at the first slot and the rest descend in size to both sides
// (see HomeProductsCarousel). Shared by the product- and service-detail pages.
// Items are type-agnostic (products OR services); `basePath` builds each card's
// link (/products or /services) so the same carousel serves both.
type RelatedItem = { slug: string; title: string; summary?: string; heroImage?: string }
const props = withDefaults(
  defineProps<{ items?: RelatedItem[]; heading?: string; basePath?: string }>(),
  { basePath: '/products' },
)
const { t } = useI18n()

const products = computed(() =>
  (props.items ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary ?? '',
    image: p.heroImage ?? '',
  })),
)
</script>

<template>
  <section v-if="items?.length" class="py-16 sm:py-20 bg-[#F7F7F7]">
    <div class="mx-auto max-w-7xl px-4">
      <MotionReveal>
        <h2 class="font-display text-2xl font-regular tracking-tight text-foreground sm:text-[32px]">
          {{ heading || t('related.heading') }}
        </h2>
      </MotionReveal>
    </div>
    <!-- Full-bleed carousel: the heading stays in the max-w-7xl column while the
         card track runs edge-to-edge. --carousel-edge aligns the first card and
         the controls to that column (max-w-7xl = 1280px, px-4 = 1rem). -->
    <div class="mt-10" :style="{ '--carousel-edge': 'max(1rem, calc((100vw - 1280px) / 2 + 1rem))' }">
      <HomeProductsCarousel :products="products" :base-path="basePath" :label="heading || t('related.heading')" />
    </div>
  </section>
</template>
