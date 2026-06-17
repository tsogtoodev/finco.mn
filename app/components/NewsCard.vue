<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ item: Collections['news'] }>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="item.to ? localePath(item.to) : '#'"
    class="group flex flex-col overflow-hidden rounded-[--radius] ring-1 ring-black/5 transition-shadow hover:shadow-2xs"
  >
    <div class="aspect-[16/10] overflow-hidden bg-muted">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.title"
        loading="lazy"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      >
      <div v-else class="size-full bg-gradient-to-br from-primary/15 via-accent/10 to-teal/15" />
    </div>
    <div class="flex flex-1 flex-col p-5">
      <time class="text-xs text-muted-foreground">{{ item.publishedAt }}</time>
      <h3 class="mt-2 font-display font-semibold text-foreground transition-colors group-hover:text-primary">
        {{ item.title }}
      </h3>
      <p v-if="item.excerpt" class="mt-2 line-clamp-2 text-sm text-muted-foreground">{{ item.excerpt }}</p>
    </div>
  </NuxtLink>
</template>
