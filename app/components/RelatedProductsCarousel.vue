<script setup lang="ts">
type RelatedItem = { slug: string; title: string; summary?: string; heroImage?: string; cardImage?: string }
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
    image: p.cardImage ?? p.heroImage ?? '',
  })),
)
</script>

<template>
  <section v-if="items?.length" class="py-16 sm:py-20 bg-[#F7F7F7]">
    <div class="mx-auto max-w-7xl px-4">
      <MotionReveal class="flex flex-col gap-[8px]">
        <h2 class="font-display text-2xl font-regular tracking-tight text-foreground sm:text-[28px]">
          {{ heading || t('related.heading') }}
        </h2>
      </MotionReveal>
    </div>
    <div class="mt-10" :style="{ '--carousel-edge': 'max(1rem, calc((100vw - 1280px) / 2 + 1rem))' }">
      <HomeProductsCarousel :products="products" :base-path="basePath" :label="heading || t('related.heading')" />
    </div>
  </section>
</template>
