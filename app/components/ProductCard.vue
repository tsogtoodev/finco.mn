<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ product: Collections['products'] }>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/products/${product.slug}`)"
    class="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[--radius] bg-dark p-6 text-white ring-1 ring-black/5"
  >
    <!-- Image -->
    <img
      v-if="product.heroImage"
      :src="product.heroImage"
      :alt="product.title"
      loading="lazy"
      class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
    >
    <div v-else class="absolute inset-0 bg-gradient-to-br from-primary via-accent/80 to-teal/70" />
    <!-- Legibility gradient -->
    <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

    <div class="relative">
      <span v-if="product.category" class="text-xs font-medium text-teal">{{ product.category }}</span>
      <h3 class="mt-1 font-display text-lg font-semibold">{{ product.title }}</h3>
      <p v-if="product.summary" class="mt-1 line-clamp-2 text-sm text-white/75">{{ product.summary }}</p>
      <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white">
        {{ $t('common.learnMore') }}
        <Icon name="lucide:arrow-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  </NuxtLink>
</template>
