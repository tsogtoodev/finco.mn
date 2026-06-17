<script setup lang="ts">
// Mission + vision (Figma 1:12287) — near-black section, two badge/heading/body
// blocks stacked on the left, a glowing 3D torus + radiant wash on the right.
import type { BadgeBlock } from '~/data/about'
import torus from '~/assets/images/about-mission-torus.svg'
import radiant from '~/assets/images/fig-3d10041054.png'

defineProps<{ blocks: BadgeBlock[] }>()
</script>

<template>
  <section class="relative overflow-hidden bg-[#080a12] text-white">
    <!-- Right-side decorative graphics -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-0">
      <img
        :src="radiant"
        alt=""
        class="absolute right-[-12%] top-1/2 w-[78%] max-w-[1200px] -translate-y-1/2 opacity-90"
      >
      <img
        :src="torus"
        alt=""
        class="absolute right-[-4%] top-1/2 w-[46%] max-w-[680px] -translate-y-1/2"
      >
      <!-- soft blue glow, lower-left -->
      <div class="absolute -bottom-24 -left-24 size-[420px] rounded-full bg-[#214784]/25 blur-[120px]" />
    </div>

    <div class="relative mx-auto max-w-7xl px-4 py-24 sm:py-28 lg:py-36">
      <div class="flex max-w-[640px] flex-col gap-20 lg:gap-32">
        <MotionReveal v-for="(b, i) in blocks" :key="i" :delay="i * 0.05">
          <div class="flex flex-col gap-6">
            <span
              class="inline-flex w-fit items-center rounded-full bg-white/20 px-4 py-1.5 text-base font-normal leading-5 text-white"
            >
              {{ b.badge }}
            </span>
            <h2 class="font-display text-[2rem] font-semibold leading-[1.3] tracking-[0.4px] sm:text-[2.5rem]">
              {{ b.heading }}
            </h2>
            <p class="max-w-[560px] text-lg font-extralight leading-8 tracking-[0.2px] text-white/80 sm:text-xl">
              {{ b.body }}
            </p>
          </div>
        </MotionReveal>
      </div>
    </div>
  </section>
</template>
