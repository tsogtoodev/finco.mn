<script setup lang="ts">
// Values section (Figma 1:12324) — heading + 5-card bento: a 3-card row over a
// 2-card row, each with a teal cube graphic. Light #fafafe background.
import type { ValueItem } from '~/data/about'

const props = defineProps<{ heading: string; subheading: string; items: ValueItem[] }>()

const rowTop = computed(() => props.items.slice(0, 3))
const rowBottom = computed(() => props.items.slice(3))
</script>

<template>
  <section class="bg-[#fafafe]">
    <div class="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:pb-32 sm:pt-24 lg:pb-40 lg:pt-28">
      <MotionReveal class="mx-auto max-w-3xl text-center">
        <h2 class="font-display text-3xl font-medium text-[#141414] sm:text-4xl">{{ heading }}</h2>
        <p class="mx-auto mt-3 max-w-2xl text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl">
          {{ subheading }}
        </p>
      </MotionReveal>

      <div class="mt-12 flex flex-col gap-4 sm:mt-16">
        <!-- Row 1: 3 cards, graphic at the bottom -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MotionReveal v-for="(it, i) in rowTop" :key="`t-${i}`" :delay="i * 0.08" class="h-full">
            <ValueCard :item="it" graphic="bottom" />
          </MotionReveal>
        </div>
        <!-- Row 2: 2 cards, graphic at the top -->
        <div class="grid gap-4 sm:grid-cols-2">
          <MotionReveal v-for="(it, i) in rowBottom" :key="`b-${i}`" :delay="i * 0.08" class="h-full">
            <ValueCard :item="it" graphic="top" />
          </MotionReveal>
        </div>
      </div>
    </div>
  </section>
</template>
