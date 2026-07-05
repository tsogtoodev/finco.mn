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
  <!-- lg min-height tracks the 1920×1080 Figma frame's aspect (1080/1920 =
       56.25vw) so the whole section scales proportionally, capped at the
       design's native 1080px on ultra-wide screens. -->
  <section class="relative isolate overflow-hidden bg-[#080a12] text-white lg:min-h-[min(56.25vw,1080px)]">

    <div class="relative mx-auto max-w-7xl px-4 py-24 sm:py-28">
      <div class="flex max-w-[640px] h-[400px] flex-col gap-20 lg:gap-32">
        <MotionReveal v-for="(b, i) in blocks.slice(0, 1)" :key="i" :delay="i * 0.05">
          <div class="flex flex-col gap-6 max-w-[524px]">
            <span
              class="inline-flex w-fit items-center rounded-full bg-white/20 px-4 py-1.5 text-base font-normal leading-5 text-white"
            >
              {{ b.badge }}
            </span>
            <h2 class="font-display text-[2rem] font-semibold leading-[1.3] tracking-[0.4px] sm:text-[24px]">
              {{ b.heading }}
            </h2>
            <p class="max-w-[560px] text-lg font-extralight leading-[24px] tracking-[0.2px] text-white/80 sm:text-[18px]">
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
      <!-- Dynamic Prismatic Discs (Figma 464:11016) — 1920×1080-frame slot at
           left 812px / top 171px, size 1524×857px (the full 16:9 scene scaled
           by 0.79373); bleeds off the right edge. All values are fractions of
           the 1920 frame so the slot scales with the viewport, capped at the
           design's native size past 1920.
           The Spline camera does NOT rescale its framing when the canvas
           resizes (it crops), so the canvas must stay at the scene's native
           1920×1080 and be CSS-scaled to the slot. tan(atan2(w, 1920px))
           divides the slot width by 1920px into the unitless factor scale()
           needs — i.e. 0.79373 at 1920, shrinking proportionally below. -->
      <div class="pointer-events-auto absolute left-[42.297%] top-[min(8.894vw,171px)] aspect-video w-[min(79.373vw,1524px)] overflow-hidden">
        <div class="h-[1080px] w-[1920px] origin-top-left scale-[calc(tan(atan2(min(79.373vw,1524px),1920px)))]">
          <ClientOnly>
            <SplineScene
              scene="https://prod.spline.design/KnmKTc7BCVBdA827/scene.splinecode"
              no-drag
              :zoom="1"
              class="size-full"
            />
            <template #fallback>
              <img :src="torus" alt="" class="size-full object-cover">
            </template>
          </ClientOnly>
        </div>
      </div>
      <!-- Bottom fades (Figma 238:7867 left, 238:7882 full-width); heights scale
           with the frame like the disc slot (309/1920 and 265/1920). -->
      <div class="pointer-events-none absolute bottom-0 left-0 h-[min(16.094vw,309px)] w-[46.6%] max-w-[894px] bg-gradient-to-b from-[rgba(8,10,18,0)] to-[#080a12]" />
      <div class="pointer-events-none absolute bottom-0 left-1/2 h-[min(13.802vw,265px)] w-full max-w-[1910px] -translate-x-1/2 bg-gradient-to-b from-[rgba(8,10,18,0)] to-[#080a12]" />
      <!-- soft blue glow, lower-left -->
      <div class="absolute -bottom-24 -left-24 size-[420px] rounded-full bg-[#214784]/25 blur-[120px]" />
    </div>
  </section>
</template>
