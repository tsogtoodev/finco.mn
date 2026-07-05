<script setup lang="ts">
// Board of directors (Figma 1:12404) — heading + member rows with dividers.
import type { AboutContent } from '~/composables/useAboutContent'

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

      <!-- Rows cascade in once the list reaches the vertical center of the
           viewport. A parent Motion drives the stagger; each child inherits
           the hidden/visible variant so they reveal in DOM order. -->
      <Motion
        as="ul"
        class="mt-12 lg:mt-16"
        initial="hidden"
        while-in-view="visible"
        :in-view-options="{ once: true, margin: '-45% 0px -45% 0px' }"
        :variants="{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
        }"
      >
        <Motion
          v-for="(m, i) in board.members"
          :key="i"
          as="li"
          :variants="{
            hidden: { opacity: 0, y: 28 },
            visible: { opacity: 1, y: 0 },
          }"
          :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
        >
          <BoardMemberRow :member="m" />
        </Motion>
      </Motion>
    </div>
  </section>
</template>
