<script setup lang="ts">
// Products listing grid (Figma 238:9267). 2-col grid of tall photo cards with a
// dark overlay gradient and a centered white title; each links to its
// /products/[slug] detail page. Card set comes from the `products` collection
// (audience + order), so the grid tracks the CMS catalog.
//
// Two hover states from the Figma component set: variant2 (idle) is just the
// centered title; the Default variant (hover) additionally fades the product
// summary in below the title and slides a "Дэлгэрэнгүй →" CTA up at the
// bottom-left. The title stays fixed at centre across both states.
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

        <!-- Idle: just the centered title. -->
        <h3
          class="relative max-w-[80%] text-center font-display text-2xl font-extrabold leading-tight text-white sm:text-[32px] sm:leading-9"
        >
          {{ c.title }}
        </h3>

        <!-- Hover: summary fades in just below the (fixed) centered title.
             `touch:` shows it outright where there is no hover — otherwise the
             card is just a title on touch and the summary is unreachable.
             `group-focus-visible:` gives keyboard users the same reveal. -->
        <p
          v-if="c.summary"
          class="pointer-events-none absolute left-1/2 top-[calc(50%+30px)] w-[85%] max-w-[492px] -translate-x-1/2 text-center text-base font-extralight leading-[22px] text-white/70 opacity-0 transition-opacity duration-300 line-clamp-2 group-hover:opacity-100 group-focus-visible:opacity-100 touch:opacity-100 motion-reduce:transition-none"
        >
          {{ c.summary }}
        </p>

        <!-- Hover: "Дэлгэрэнгүй →" CTA slides up at the bottom-left. -->
        <span
          class="pointer-events-none absolute bottom-0 left-0 flex translate-y-2 items-center gap-1.5 px-6 py-4 text-lg font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 touch:translate-y-0 touch:opacity-100 motion-reduce:transition-none"
        >
          {{ $t('common.learnMore') }}
          <Icon name="lucide:arrow-right" class="size-4" />
        </span>
      </NuxtLink>
    </div>
  </section>
</template>
