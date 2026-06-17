<script setup lang="ts">
// Board of directors (Figma 1:12404) — heading + member rows with dividers.
import type { AboutContent } from '~/data/about'

defineProps<{ board: AboutContent['board'] }>()
</script>

<template>
  <section class="bg-[#fbfbfb]">
    <div class="mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-32">
      <MotionReveal>
        <h2 class="font-display text-3xl font-normal leading-tight text-[#141414] sm:text-4xl">
          {{ board.headingLead }}<span class="text-[#4c41d8]">{{ board.headingAccent }}</span>
        </h2>
      </MotionReveal>

      <ul class="mt-12 lg:mt-16">
        <MotionReveal v-for="(m, i) in board.members" :key="i" as="li" :delay="(i % 2) * 0.06">
          <BoardMemberRow :member="m" />
        </MotionReveal>
      </ul>
    </div>
  </section>
</template>
