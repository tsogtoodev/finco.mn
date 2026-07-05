<script setup lang="ts">
// Mission + vision (Figma 1:12287) — near-black section, two badge/heading/body
// blocks stacked on the left, a glowing 3D torus + radiant wash on the right.
import type { BadgeBlock } from '~/composables/useAboutContent'
import torus from '~/assets/images/about-mission-torus.svg'
import radiant from '~/assets/images/fig-3d10041054.png'
import fractalGlow from '~/assets/images/about-mission-fractal-glow.png'

defineProps<{ blocks: BadgeBlock[] }>()
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#080a12] text-white">

    <div class="relative mx-auto max-w-7xl px-4 py-24 sm:py-28">
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

    <!-- Right-side decorative graphics. -z-10 keeps this layer behind the text
         content (which sits at z-auto) — the fractal-glow raster is opaque and
         would otherwise cover the left-hand text. -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
      <!-- Fractal glow (Figma 369:20237) — Figma's own raster export so the blur
           matches exactly. Its dark areas are #080a12 (= section bg), so it
           composites seamlessly. Spans the section's left region 1:1. -->
      <img
        :src="fractalGlow"
        alt=""
        class="absolute left-0 top-0 h-full w-[59%] max-w-[849px] object-fill"
      >
      <div class="pointer-events-auto absolute bottom-0 right-0 translate-x-1/3 translate-y-1/5 scale-120">
        <ClientOnly>
          <SplineScene
            scene="https://prod.spline.design/5QI6kS8kPdn7j7Y3/scene.splinecode"
            :reveal-delay="1000"
            class="scale-180"
          />
          <template #fallback>
            <img :src="torus" alt="" class="size-full object-contain">
          </template>
        </ClientOnly>
      </div>
      <!-- soft blue glow, lower-left -->
      <div class="absolute -bottom-24 -left-24 size-[420px] rounded-full bg-[#214784]/25 blur-[120px]" />
    </div>
  </section>
</template>
