<script setup lang="ts">
// History timeline (Figma 1:12392) — heading + subtext + a 2-column milestone
// grid (year + description). Faint lavender wash toward the bottom rows.
import type { Milestone } from '~/data/about'

defineProps<{ heading: string; subheading: string; milestones: Milestone[] }>()
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfb]">
    <!-- faint lavender bands behind the lower rows (Figma) -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-1/2 bg-gradient-to-b from-transparent via-[#f7f6ff] to-[#efeefd]"
    />

    <div class="relative mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-32">
      <MotionReveal class="max-w-3xl">
        <h2 class="font-display text-3xl font-normal text-[#141414] sm:text-4xl">{{ heading }}</h2>
        <p class="mt-6 max-w-3xl text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl">
          {{ subheading }}
        </p>
      </MotionReveal>

      <!-- Rows cascade in once the grid reaches the vertical center of the
           viewport. A parent Motion drives the stagger; each child inherits
           the hidden/visible variant so they reveal in DOM order. -->
      <Motion
        class="mt-14 grid gap-x-16 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:gap-x-20"
        initial="hidden"
        while-in-view="visible"
        :in-view-options="{ once: true, margin: '-45% 0px -45% 0px' }"
        :variants="{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
        }"
      >
        <Motion
          v-for="(m, i) in milestones"
          :key="i"
          as="div"
          :variants="{
            hidden: { opacity: 0, y: 28 },
            visible: { opacity: 1, y: 0 },
          }"
          :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
        >
          <div class="font-display text-3xl font-medium text-[#141414] sm:text-4xl">{{ m.year }}</div>
          <p class="mt-5 text-[1.0625rem] font-light leading-7 text-[rgba(0,0,0,0.7)] sm:text-lg">
            {{ m.body }}
          </p>
        </Motion>
      </Motion>
    </div>
  </section>
</template>
