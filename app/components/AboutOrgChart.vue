<script setup lang="ts">
// Organisational structure (Figma 1:12444) — ТУЗ → CEO → 5 departments.
// Desktop: HTML pills positioned in a 1440×380 coordinate space with an SVG
// bezier-connector overlay (both scale together). Mobile: a stacked,
// semantic nested tree. Real text throughout — never a screenshot.
import type { AboutContent } from '~/data/about'

const props = defineProps<{ org: AboutContent['org'] }>()

// Node centres in the 1440×380 viewBox the SVG + pills share.
const VB = { w: 1440, h: 380 }
const root = { x: 720, y: 54 }
const ceo = { x: 720, y: 174 }
const depts = computed(() =>
  [
    { x: 205, y: 232 }, // 0 mid-left
    { x: 1235, y: 232 }, // 1 mid-right
    { x: 360, y: 330 }, // 2 low-left
    { x: 720, y: 330 }, // 3 low-centre
    { x: 1080, y: 330 }, // 4 low-right
  ].map((p, i) => ({ ...p, label: props.org.departments[i] ?? '' })),
)

// Connector paths (CEO edges → each node), tuned to the Figma curve geometry.
const connectors = [
  'M720,76 L720,150', // root → ceo
  'M720,198 L720,308', // ceo → centre dept
  'M610,182 C 505,182 510,232 400,232', // ceo → mid-left
  'M830,182 C 935,182 930,232 1040,232', // ceo → mid-right
  'M648,198 C 540,250 470,330 478,330', // ceo → low-left
  'M792,198 C 900,250 970,330 962,330', // ceo → low-right
]

const pct = (v: number, total: number) => `${(v / total) * 100}%`
</script>

<template>
  <section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-32">
      <MotionReveal class="max-w-3xl">
        <h2 class="font-display text-3xl font-normal leading-tight text-[#141414] sm:text-4xl">
          {{ org.headingLead }}<span class="text-[#5457dc]">{{ org.headingAccent }}</span>
        </h2>
        <p class="mt-6 max-w-3xl text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl">
          {{ org.subheading }}
        </p>
      </MotionReveal>

      <!-- Desktop diagram -->
      <MotionReveal :delay="0.1" class="mt-14 hidden lg:mt-20 lg:block">
        <figure class="relative mx-auto aspect-[1440/380] w-full rounded-3xl bg-black/[0.015]">
          <figcaption class="sr-only">
            {{ org.root }} → {{ org.ceo }} → {{ org.departments.join(', ') }}
          </figcaption>

          <!-- connectors -->
          <svg
            class="absolute inset-0 size-full"
            :viewBox="`0 0 ${VB.w} ${VB.h}`"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            aria-hidden="true"
          >
            <path
              v-for="(d, i) in connectors"
              :key="i"
              :d="d"
              stroke="#b7c0d6"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>

          <!-- root -->
          <div
            class="absolute -translate-x-1/2 -translate-y-1/2"
            :style="{ left: pct(root.x, VB.w), top: pct(root.y, VB.h) }"
          >
            <span class="block whitespace-nowrap rounded-full bg-[#4c41d8] px-8 py-3 text-lg font-normal text-white">
              {{ org.root }}
            </span>
          </div>

          <!-- ceo -->
          <div
            class="absolute -translate-x-1/2 -translate-y-1/2"
            :style="{ left: pct(ceo.x, VB.w), top: pct(ceo.y, VB.h) }"
          >
            <span class="block whitespace-nowrap rounded-full bg-[#4c41d8]/10 p-1 backdrop-blur-sm">
              <span class="block whitespace-nowrap rounded-full bg-white px-8 py-3 text-lg font-normal text-[rgba(0,0,0,0.8)] shadow-2xs">
                {{ org.ceo }}
              </span>
            </span>
          </div>

          <!-- departments -->
          <div
            v-for="(d, i) in depts"
            :key="i"
            class="absolute -translate-x-1/2 -translate-y-1/2"
            :style="{ left: pct(d.x, VB.w), top: pct(d.y, VB.h) }"
          >
            <span class="block whitespace-nowrap rounded-full bg-teal/20 px-6 py-3 text-base font-light text-[rgba(0,0,0,0.6)]">
              {{ d.label }}
            </span>
          </div>
        </figure>
      </MotionReveal>

      <!-- Mobile stacked tree -->
      <MotionReveal :delay="0.1" class="mt-12 lg:hidden">
        <div class="flex flex-col items-center">
          <span class="whitespace-nowrap rounded-full bg-[#4c41d8] px-7 py-2.5 text-base font-normal text-white">
            {{ org.root }}
          </span>
          <span aria-hidden="true" class="h-6 w-px bg-[#b7c0d6]" />
          <span class="rounded-full bg-[#4c41d8]/10 p-1">
            <span class="block whitespace-nowrap rounded-full bg-white px-7 py-2.5 text-base font-normal text-[rgba(0,0,0,0.8)] shadow-2xs">
              {{ org.ceo }}
            </span>
          </span>
          <span aria-hidden="true" class="h-6 w-px bg-[#b7c0d6]" />
          <ul class="w-full space-y-3 border-t border-[#b7c0d6]/40 pt-6">
            <li v-for="(d, i) in org.departments" :key="i">
              <span class="block rounded-2xl bg-teal/20 px-5 py-3 text-center text-sm font-light text-[rgba(0,0,0,0.7)]">
                {{ d }}
              </span>
            </li>
          </ul>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>
