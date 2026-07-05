<script setup lang="ts">
// Values section (Figma 238:7884) — heading + 5-card bento (a 3-card row over a
// 2-card row). Each card reveals a slice of one shared teal cube-cluster image
// (see ValueCard). Light #fafafe background. Entrance uses the CSS `.hero-rise`
// stagger rather than motion-v so below-the-fold content is never stranded at
// opacity:0 on SSR (see app/assets/css/main.css).
import type { ValueItem } from '~/composables/useAboutContent'

const props = defineProps<{ heading: string; subheading: string; items: ValueItem[] }>()

const rowTop = computed(() => props.items.slice(0, 3))
const rowBottom = computed(() => props.items.slice(3))
</script>

<template>
  <section class="relative overflow-hidden bg-[#fafafe]">
    <!-- pb-8 (32px) pairs with AboutTimeline's pt-8 for a fixed 64px gap between the two sections. -->
    <div class="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:pt-24 lg:pt-28">
      <div class="hero-rise flex flex-col items-center gap-3 text-center">
        <h2 class="max-w-[750px] font-display text-3xl font-medium leading-tight text-[#141414] sm:text-4xl lg:text-[36px] lg:leading-9">
          {{ heading }}
        </h2>
        <p class="max-w-[1012px] text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl lg:text-[20px] lg:leading-7">
          {{ subheading }}
        </p>
      </div>

      <div class="mt-12 flex flex-col gap-4 sm:mt-16 lg:mt-20">
        <!-- Row 1: 3 cards, text top / cluster rising from the bottom -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ValueCard
            v-for="(it, i) in rowTop"
            :key="`t-${i}`"
            class="hero-rise"
            :style="{ animationDelay: `${0.1 + i * 0.08}s` }"
            :item="it"
            :cols="3"
            :index="i"
            row="top"
          />
        </div>
        <!-- Row 2: 2 cards, text bottom / cluster descending from the top -->
        <div class="grid gap-4 sm:grid-cols-2">
          <ValueCard
            v-for="(it, i) in rowBottom"
            :key="`b-${i}`"
            class="hero-rise"
            :style="{ animationDelay: `${0.26 + i * 0.08}s` }"
            :item="it"
            :cols="2"
            :index="i"
            row="bottom"
          />
        </div>
      </div>
    </div>
  </section>
</template>
