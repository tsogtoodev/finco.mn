<script setup lang="ts">
// Products listing grid (Figma 1:13722 / 1:13945). 2-col grid of tall photo cards
// with a dark overlay gradient and a centered white title; each links to its
// /products/[slug] detail page. Card set comes from the `products` collection
// (audience + order), so the grid tracks the CMS catalog.
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const localePath = useLocalePath()

const cards = await useProductList(props.audience)
</script>

<template>
  <section class="max-w-7xl mx-auto bg-[#fbfbfc] px-6 pb-20 pt-16 sm:pt-24">
    <div class="mx-auto grid max-w-[1426px] gap-6 sm:grid-cols-2">
      <NuxtLink
        v-for="c in cards"
        :key="c.slug"
        :to="localePath(`/products/${c.slug}`)"
        class="group relative flex h-[260px] items-center justify-center overflow-hidden rounded-[var(--radius)] sm:h-[400px]"
      >
        <NuxtImg
          v-if="c.heroImage"
          :src="c.heroImage"
          :alt="c.title"
          width="713"
          height="400"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <!-- legibility scrim: flat 50% black + bottom-up gradient (Figma) -->
        <div aria-hidden="true" class="absolute inset-0 bg-black/50" />
        <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

        <h3
          class="relative max-w-[80%] text-center font-display text-2xl font-extrabold leading-tight text-white sm:text-[32px] sm:leading-9"
        >
          {{ c.title }}
        </h3>
      </NuxtLink>
    </div>
  </section>
</template>
