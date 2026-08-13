<script setup lang="ts">
import type { AboutContent } from '~/composables/useAboutContent'

const props = defineProps<{ org: AboutContent['org'] }>()

const VB = { w: 1440, h: 450 }
const pctX = (v: number) => `${(v / VB.w) * 100}%`
const pctY = (v: number) => `${(v / VB.h) * 100}%`

const TX = { right: '-100%', left: '0%', center: '-50%' } as const
type Anchor = keyof typeof TX
const depts = computed(() =>
  (
    [
      { x: 472, y: 256, anchor: 'right' },
      { x: 968, y: 256, anchor: 'left' },
      { x: 472, y: 358, anchor: 'right' },
      { x: 720, y: 358, anchor: 'center' },
      { x: 968, y: 358, anchor: 'left' },
    ] satisfies { x: number; y: number; anchor: Anchor }[]
  ).map((p, i) => ({ ...p, label: props.org.departments[i] ?? '' })),
)
const nodeStyle = (x: number, y: number, anchor: Anchor) => ({
  left: pctX(x),
  top: pctY(y),
  transform: `translate(${TX[anchor]}, -50%)`,
})

const connectors = [
  { d: 'M720,121 L720,190', g: 'oc-root' },
  { d: 'M720,250 L720,332', g: 'oc-center' },
  { d: 'M596,224 C534,224 534,256 472,256', g: 'oc-ml' },
  { d: 'M844,224 C906,224 906,256 968,256', g: 'oc-mr' },
  { d: 'M643,250 C643,330 540,358 472,358', g: 'oc-ll' },
  { d: 'M797,250 C797,330 900,358 968,358', g: 'oc-lr' },
]

const ceoGlow =
  'background: radial-gradient(115% 82% at 60% 122%, rgba(74,210,196,0.6) 0%, rgba(74,210,196,0) 56%), linear-gradient(100deg, #ffa7e6 0%, #dcc0f4 36%, #cdcdf7 55%, #b2cff3 100%)'
const tuzGlow = 'background: linear-gradient(125deg, #ffa6e9 0%, #b89bf1 55%, #8784ea 100%)'
</script>

<template>
  <section class="bg-white">
    <div class="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      <div class="hero-rise flex max-w-[1012px] flex-col gap-[8px]">
        <h2
          class="max-w-[750px] font-display text-3xl font-normal leading-tight text-[#141414] sm:text-[28px] lg:text-[28px] lg:leading-[44px]"
        >
          {{ org.headingLead }}<span class="text-[#5457dc]">{{ org.headingAccent }}</span>
        </h2>
        <p
          class="text-lg font-extralight leading-[26px] text-[rgba(0,0,0,0.6)] sm:text-[18px] lg:text-[18px]"
        >
          {{ org.subheading }}
        </p>
      </div>

      <figure
        class="org-diagram hero-rise relative mx-auto mt-14 hidden aspect-[1440/450] w-full lg:mt-16 lg:block"
        style="animation-delay: 0.1s"
      >
        <figcaption class="sr-only">
          {{ org.root }} → {{ org.ceo }} → {{ org.departments.join(', ') }}
        </figcaption>

        <svg
          class="absolute inset-0 size-full"
          :viewBox="`0 0 ${VB.w} ${VB.h}`"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="oc-root" x1="720" y1="121" x2="720" y2="190" gradientUnits="userSpaceOnUse">
              <stop stop-color="#4c41d8" />
              <stop offset="1" stop-color="#5457dc" />
            </linearGradient>
            <linearGradient id="oc-center" x1="720" y1="250" x2="720" y2="332" gradientUnits="userSpaceOnUse">
              <stop stop-color="#5457dc" />
              <stop offset="1" stop-color="#2de0c6" />
            </linearGradient>
            <linearGradient id="oc-ml" x1="596" y1="224" x2="472" y2="256" gradientUnits="userSpaceOnUse">
              <stop stop-color="#5457dc" />
              <stop offset="1" stop-color="#2de0c6" />
            </linearGradient>
            <linearGradient id="oc-mr" x1="844" y1="224" x2="968" y2="256" gradientUnits="userSpaceOnUse">
              <stop stop-color="#5457dc" />
              <stop offset="1" stop-color="#2de0c6" />
            </linearGradient>
            <linearGradient id="oc-ll" x1="643" y1="250" x2="472" y2="358" gradientUnits="userSpaceOnUse">
              <stop stop-color="#5457dc" />
              <stop offset="1" stop-color="#2de0c6" />
            </linearGradient>
            <linearGradient id="oc-lr" x1="797" y1="250" x2="968" y2="358" gradientUnits="userSpaceOnUse">
              <stop stop-color="#5457dc" />
              <stop offset="1" stop-color="#2de0c6" />
            </linearGradient>
          </defs>
          <path
            v-for="(c, i) in connectors"
            :key="i"
            :d="c.d"
            :stroke="`url(#${c.g})`"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>

        <div class="absolute" :style="nodeStyle(720, 91, 'center')">
          <div class="relative">
            <span aria-hidden="true" class="org-glow org-glow--tuz" :style="tuzGlow" />
            <span class="org-pill org-pill--tuz relative bg-[#4c41d8] font-normal text-white">
              {{ org.root }}
            </span>
          </div>
        </div>

        <div class="absolute" :style="nodeStyle(720, 219.5, 'center')">
          <div class="relative">
            <span aria-hidden="true" class="org-glow" :style="ceoGlow" />
            <span class="org-pill org-pill--ceo relative bg-white font-normal text-black/80">
              {{ org.ceo }}
            </span>
          </div>
        </div>

        <div v-for="(d, i) in depts" :key="i" class="absolute" :style="nodeStyle(d.x, d.y, d.anchor)">
          <span class="org-pill bg-[rgba(45,224,198,0.2)] font-light text-[rgba(0,0,0,0.6)]">
            {{ d.label }}
          </span>
        </div>
      </figure>

      <div class="mt-12 flex flex-col items-center lg:hidden">
        <div class="relative">
          <span aria-hidden="true" class="absolute -inset-[5px] rounded-[26px] opacity-80 blur-[9px]" :style="tuzGlow" />
          <span class="relative block whitespace-nowrap rounded-[24px] border border-black/10 bg-[#4c41d8] px-7 py-2.5 text-center text-base font-normal text-white">
            {{ org.root }}
          </span>
        </div>
        <span aria-hidden="true" class="my-3 h-6 w-px bg-[#b7c0d6]" />
        <div class="relative">
          <span aria-hidden="true" class="absolute -inset-[6px] rounded-[28px] blur-[10px]" :style="ceoGlow" />
          <span class="relative block whitespace-nowrap rounded-[24px] bg-white px-7 py-2.5 text-center text-base font-normal text-black/80 shadow-[0_10px_28px_-14px_rgba(76,65,216,0.45)]">
            {{ org.ceo }}
          </span>
        </div>
        <span aria-hidden="true" class="mt-3 h-6 w-px bg-[#b7c0d6]" />
        <ul class="w-full space-y-3 border-t border-[#b7c0d6]/40 pt-6">
          <li v-for="(d, i) in org.departments" :key="i">
            <span class="block rounded-[24px] bg-[rgba(45,224,198,0.2)] px-5 py-3 text-center text-sm font-light text-[rgba(0,0,0,0.7)]">
              {{ d }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.org-diagram {
  container-type: inline-size;
}
.org-pill {
  display: block;
  white-space: nowrap;
  text-align: center;
  font-size: 1.25cqw;
  line-height: 1.9444cqw;
  padding: 0.8333cqw 2.2222cqw;
  border-radius: 1.6667cqw;
}
.org-pill--ceo {
  width: 17.222cqw;
  box-shadow: 0 0.7cqw 1.9cqw -1cqw rgba(76, 65, 216, 0.45);
}
.org-pill--tuz {
  width: 8.125cqw;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 0.55cqw 1.5cqw -0.7cqw rgba(76, 65, 216, 0.6);
}
.org-glow {
  position: absolute;
  inset: -0.42cqw;
  border-radius: 1.94cqw;
  filter: blur(0.8cqw);
  opacity: 0.85;
}
.org-glow--tuz {
  inset: -0.35cqw;
  border-radius: 1.8cqw;
  filter: blur(0.72cqw);
  opacity: 0.5;
}
</style>
