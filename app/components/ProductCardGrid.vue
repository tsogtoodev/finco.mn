<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ products?: Collections['products'][] }>()
</script>

<template>
  <div v-if="products?.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <MotionReveal v-for="(p, i) in products" :key="p.slug" :delay="(i % 3) * 0.06">
      <ProductCard :product="p" />
    </MotionReveal>
  </div>
</template>
