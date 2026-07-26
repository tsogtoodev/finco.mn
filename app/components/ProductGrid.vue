<script setup lang="ts">
// Products listing grid (Figma 574:6915). 2-col grid of photo cards with a dark
// scrim and a centered white title; each links to its /products/[slug] page.
// Card set comes from the `products` collection (audience + order), so the grid
// tracks the CMS catalog.
//
// Figma lays the component set out as two columns: the LEFT card of each row is
// the hover variant, the RIGHT one is idle. Idle = flat 50% black scrim + the
// centered title. Hover = scrim darkens to 65% and gains a 4.45px backdrop blur,
// the title slides up 44.45px, the summary fades in below it, and the
// "Дэлгэрэнгүй" bar slides up its full height at the bottom with the arrow
// pushed to the far right.
//
// Geometry: 588×240 cards, 24px gutters, 1200px column.
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const localePath = useLocalePath()

const cards = await useProductList(props.audience)
</script>

<template>
  <section class="bg-[#fbfbfc] px-6 pb-20 pt-16 sm:pt-[80px]">
    <div class="mx-auto grid max-w-[1200px] gap-6 sm:grid-cols-2">
      <NuxtLink
        v-for="c in cards"
        :key="c.slug"
        :to="localePath(`/products/${c.slug}`)"
        class="group relative flex h-[240px] items-center justify-center overflow-hidden rounded-[12px]"
      >
        <NuxtImg
          v-if="c.heroImage"
          :src="c.heroImage"
          :alt="c.title"
          width="588"
          height="240"
          sizes="588px"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <!-- Legibility scrim: bottom-up gradient + a flat wash that deepens
             50% → 65% and picks up a 4.45px backdrop blur on hover. -->
        <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-black/50 transition-[background-color,backdrop-filter] duration-300 group-hover:bg-black/65 group-hover:backdrop-blur-[4.45px] group-focus-visible:bg-black/65 group-focus-visible:backdrop-blur-[4.45px] touch:bg-black/65 touch:backdrop-blur-[4.45px] motion-reduce:transition-none"
        />

        <!-- Title: centred idle, lifted on hover to make room for the summary.
             Spans the full card inset by the design's 24px gutters — NOT
             `left-1/2 + -translate-x-1/2`, which makes an absolutely positioned
             box shrink-to-fit against only half the card (294px) and wraps
             titles that would otherwise fit, regardless of `max-w`.
             The hover offset is `100% + 26.45px`, which pins the title's BOTTOM
             at 93.55px from the card top whatever its height: for the design's
             one-line title that is exactly Figma's 44.45px lift, and a title
             that wraps grows upward instead of down into the summary. -->
        <h3
          class="absolute inset-x-6 top-1/2 -translate-y-1/2 text-balance text-center font-display text-2xl font-extrabold leading-9 text-white transition-transform duration-300 group-hover:-translate-y-[calc(100%+26.45px)] group-focus-visible:-translate-y-[calc(100%+26.45px)] touch:-translate-y-[calc(100%+26.45px)] motion-reduce:transition-none"
        >
          {{ c.title }}
        </h3>

        <!-- Summary fades in centred just below the lifted title. `touch:` shows
             it outright where there is no hover; `group-focus-visible:` gives
             keyboard users the same reveal. -->
        <p
          v-if="c.summary"
          class="pointer-events-none absolute inset-x-6 top-[calc(50%+2px)] mx-auto max-w-[492px] -translate-y-1/2 text-center text-base font-extralight leading-5 text-white opacity-0 transition-opacity duration-300 line-clamp-2 group-hover:opacity-100 group-focus-visible:opacity-100 touch:opacity-100 motion-reduce:transition-none"
        >
          {{ c.summary }}
        </p>

        <!-- "Дэлгэрэнгүй →" bar slides up its own height at the bottom; the
             arrow sits at the far right (24px in), per the design. -->
        <span
          class="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-0.5 px-6 py-4 text-lg font-semibold leading-9 text-white opacity-0 transition-[transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 touch:translate-y-0 touch:opacity-100 motion-reduce:transition-none"
        >
          <span class="flex-1 text-left">{{ $t('common.learnMore') }}</span>
          <Icon name="lucide:arrow-right" class="size-4 shrink-0" />
        </span>
      </NuxtLink>
    </div>
  </section>
</template>
