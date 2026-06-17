<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ products?: Collections['products'][]; heading?: string }>()
const { t } = useI18n()
</script>

<template>
  <section v-if="products?.length" class="mx-auto max-w-7xl px-4 py-16">
    <h2 class="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
      {{ heading || t('related.heading') }}
    </h2>
    <div class="mt-8 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ProductCard
        v-for="p in products"
        :key="p.slug"
        :product="p"
        class="w-[280px] shrink-0"
      />
    </div>
  </section>
</template>
