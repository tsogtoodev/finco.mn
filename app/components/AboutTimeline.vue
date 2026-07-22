<script setup lang="ts">
// History timeline (Figma 238:7952) — heading + a series of year-PAIR rows.
// Milestones are grouped two-per-row, and each row sits on its own full-bleed
// band whose lavender tint deepens down the page (#fbfbfb → #f7f6ff → #efeefd).
import type { Milestone } from '~/composables/useAboutContent'

const props = defineProps<{
  headingLead: string
  headingAccent: string
  subheading: string
  milestones: Milestone[]
}>()

// Full-bleed band tint per row, deepening down the section (Figma). Rows past
// the last tint clamp to the deepest one.
const ROW_TINTS = ['#fbfbfb', '#f7f6ff', '#efeefd'] as const
const rowTint = (i: number) => ROW_TINTS[Math.min(i, ROW_TINTS.length - 1)]

// Pair milestones up: [2005, 2023], [2024, 2025], [2025, 2026] …
const rows = computed(() => {
  const paired: Milestone[][] = []
  for (let i = 0; i < props.milestones.length; i += 2) {
    paired.push(props.milestones.slice(i, i + 2))
  }
  return paired
})
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfb]">
    <!-- pt-8 (32px) pairs with AboutValues' pb-8 for a fixed 64px gap between the two sections. -->
    <div class="mx-auto max-w-7xl px-4 pt-8 sm:pt-16">
      <MotionReveal class="max-w-5xl">
        <h2 class="font-display text-3xl font-medium text-[#141414] sm:text-4xl">
          {{ headingLead }}<span class="text-[#4c41d8]">{{ headingAccent }}</span>
        </h2>
        <p class="mt-6 max-w-5xl text-lg font-extralight leading-[26px] text-[rgba(0,0,0,0.6)] sm:text-[18px]">
          {{ subheading }}
        </p>
      </MotionReveal>
    </div>

    <!-- Year-pair rows. Each band is full-bleed with its own tint and reveals as
         a single unit (both columns together) once it reaches the vertical centre
         of the viewport — so the rows cascade in row by row as you scroll. -->
    <div class="mt-8 lg:mt-10">
      <div
        v-for="(row, ri) in rows"
        :key="ri"
        class="w-full"
        :style="{ backgroundColor: rowTint(ri) }"
      >
        <Motion
          as="div"
          class="mx-auto grid max-w-7xl gap-x-16 gap-y-[24px] px-4 py-6 sm:grid-cols-2 sm:py-[32px] lg:gap-x-20"
          :initial="{ opacity: 0, y: 28 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :in-view-options="{ once: true, margin: '-25% 0px -25% 0px' }"
          :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
        >
          <div v-for="(m, ci) in row" :key="ci">
            <div class="font-display text-xl font-medium text-[#141414] sm:text-[28px]">{{ m.year }}</div>
            <p class="mt-4 text-sm font-light leading-[24px] text-[rgba(0,0,0,0.7)] sm:text-[16px]">
              {{ m.body }}
            </p>
          </div>
        </Motion>
      </div>
    </div>
  </section>
</template>
