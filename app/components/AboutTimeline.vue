<script setup lang="ts">
// History timeline (Figma 238:7952) — heading + a series of year-PAIR rows.
// Milestones are grouped two-per-row, and each row sits on its own full-bleed
// band whose lavender tint deepens down the page (#fbfbfb → #f7f6ff → #efeefd).
import type { Milestone } from '~/composables/useAboutContent'

const props = defineProps<{ heading: string; subheading: string; milestones: Milestone[] }>()

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
    <div class="mx-auto max-w-7xl px-4 pt-20 sm:pt-24 lg:pt-32">
      <MotionReveal class="max-w-3xl">
        <h2 class="font-display text-3xl font-normal text-[#141414] sm:text-4xl">{{ heading }}</h2>
        <p class="mt-6 max-w-3xl text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl">
          {{ subheading }}
        </p>
      </MotionReveal>
    </div>

    <!-- Year-pair rows. Each band is full-bleed with its own tint and reveals as
         a single unit (both columns together) once it reaches the vertical centre
         of the viewport — so the rows cascade in row by row as you scroll. -->
    <div class="mt-12 lg:mt-16">
      <div
        v-for="(row, ri) in rows"
        :key="ri"
        class="w-full"
        :style="{ backgroundColor: rowTint(ri) }"
      >
        <Motion
          as="div"
          class="mx-auto grid max-w-7xl gap-x-16 gap-y-12 px-4 py-14 sm:grid-cols-2 sm:py-16 lg:gap-x-20"
          :initial="{ opacity: 0, y: 28 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :in-view-options="{ once: true, margin: '-25% 0px -25% 0px' }"
          :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
        >
          <div v-for="(m, ci) in row" :key="ci">
            <div class="font-display text-3xl font-medium text-[#141414] sm:text-4xl">{{ m.year }}</div>
            <p class="mt-5 text-[1.0625rem] font-light leading-7 text-[rgba(0,0,0,0.7)] sm:text-lg">
              {{ m.body }}
            </p>
          </div>
        </Motion>
      </div>
    </div>
  </section>
</template>
