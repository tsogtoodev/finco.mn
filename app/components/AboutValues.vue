<script setup lang="ts">
// Values section (Figma 571:6515) — heading + two-column explorer: the live
// teal cube-cluster Spline scene on the left (raster fallback while it loads),
// joined by a dashed connector spine with five numbered diamond markers to five
// selectable value cards on the right.
// The active card is white with a soft shadow and teal semibold title; its marker
// lights up. Clicking a card or marker activates it; non-active cards tint on
// hover (Figma's `hover` annotation). The cluster + spine are desktop-only (lg+);
// tablet (md–lg) uses a 2+3 card grid with the cluster in the bottom-right
// (Figma 462:9281); below md the cards simply stack. Entrance uses the CSS
// `.hero-rise` stagger rather than motion-v so below-the-fold content is never
// stranded at opacity:0 on SSR (see app/assets/css/main.css).
import type { ValueItem } from '~/composables/useAboutContent'
import cluster from '~/assets/images/fig-76f105c432.png'

defineProps<{
  headingLead: string
  headingAccent: string
  subheading: string
  items: ValueItem[]
}>()

const active = ref(0)

// Live cluster on capable devices, the matching raster everywhere else.
const splineEnabled = useSplineEnabled()

// Marker rows are evenly spaced down the 568px spine (132.1px between centres),
// independent of the cards' heights — matches Figma's fixed grid.
const markerTop = (i: number) => `${i * 110}px`

// Highlighted connector route (viewBox space of the spine SVG): cluster branch →
// vertical spine → the active marker's stub. Redrawn (and its draw-in animation
// replayed via :key) whenever the selection changes.
const SPINE_X = 153.695
const STUB_X = 192.981
const MARKER_YS = [1, 134.445, 265.207, 397.877, 529.413]
const routeD = computed(() => {
  const y = MARKER_YS[active.value] ?? MARKER_YS[0]
  return `M 1 265.691 L ${SPINE_X} 264.723 L ${SPINE_X} ${y} L ${STUB_X} ${y}`
})
</script>

<template>
  <section class="relative overflow-hidden bg-[#fafafe]">
    <div class="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:pt-24 md:pb-40 md:pt-[80px] lg:pb-20 lg:pt-28 lg:px-0">
      <div class="hero-rise relative z-[1] flex flex-col items-center gap-3 text-center">
        <h2 class="max-w-[750px] font-display text-3xl font-medium leading-tight text-[#141414] sm:text-4xl md:text-[36px] md:leading-9 lg:text-[36px] lg:leading-9">
          {{ headingLead }}<span class="text-[#2de0c6]">{{ headingAccent }}</span>
        </h2>
        <p class="max-w-[1012px] text-lg font-extralight leading-[26px] text-[rgba(0,0,0,0.6)] sm:text-xl md:text-[20px] md:leading-7 lg:text-[20px] lg:leading-7">
          {{ subheading }}
        </p>
      </div>

      <div class="relative mx-auto mt-12 max-w-[1200px] sm:mt-16 md:mt-20 lg:mt-[80px]">
        <div
          aria-hidden="true"
          class="absolute z-0 hidden -translate-x-[60%] -translate-y-1/2 lg:block"
          style="--cluster-size: clamp(1267px, 93.75vw, 1800px); left: max(250px, calc(600px - 18.229vw)); top: calc(50% - 40px); width: var(--cluster-size); height: var(--cluster-size)"
        >
          <div
            v-if="splineEnabled"
            class="h-[1024px] w-[1024px] origin-top-left"
            style="scale: calc(tan(atan2(var(--cluster-size), 1024px)))"
          >
            <SplineScene
              scene="https://prod.spline.design/n2ZpeSHKKA8Olc1E/scene.splinecode?timestamp=20260810040000"
              :zoom="1"
              no-hover
              defer-until-lcp
              class="size-full"
            />
          </div>
          <img
            v-else
            :src="cluster"
            alt=""
            class="absolute left-1/2 top-1/2 w-[1483px] max-w-none mix-blend-multiply"
            style="transform: translate(calc(-50% - 95px), calc(-50% - 27px))"
          >
        </div>

        <div class="pointer-events-none relative hidden items-center gap-8 lg:flex">
          <div class="hero-rise pointer-events-auto relative z-10 hidden h-[568px] w-[241px] shrink-0 lg:ml-[367px] lg:block top-[50px]" style="animation-delay: 0.1s">
            <svg
            class="absolute left-0 top-[20px] h-[445px] w-[192px]"
            viewBox="0 0 193.981 530.413"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M1 265.691L153.695 264.723M192.981 1L154.695 1M192.981 134.445L154.695 134.445M192.981 265.207H154.695M192.981 397.877H154.695M192.981 529.413H154.695M153.695 528.413L153.695 1.99972"
              stroke="#2DE0C6"
              stroke-opacity="0.25"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="6 6"
            />
            <mask id="values-spine-reveal" maskUnits="userSpaceOnUse">
              <path
                :key="`mask-${active}`"
                :d="routeD"
                class="spine-draw"
                pathLength="1"
                stroke="white"
                stroke-width="4"
                stroke-linecap="round"
                fill="none"
              />
            </mask>
            <path
              :key="`route-${active}`"
              :d="routeD"
              mask="url(#values-spine-reveal)"
              stroke="#2DE0C6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="6 6"
              fill="none"
            />
          </svg>
          <button
            v-for="(it, i) in items"
            :key="`m-${i}`"
            type="button"
            class="absolute left-[201px] h-[40px] w-[40px]"
            :style="{ top: markerTop(i) }"
            :aria-label="it.title"
            @click="active = i"
          >
            <span
              class="absolute left-1/2 top-1/2 h-[29px] w-[29px] rounded-[4px] border border-white/60 bg-gradient-to-b from-[rgba(2,194,191,0.8)] to-[rgba(81,240,237,0.8)] transition-opacity duration-300"
              style="transform: translate(-50%, -50%) rotate(29.21deg) skewX(-1.59deg)"
              :class="active === i ? 'opacity-100' : 'opacity-20'"
            />
            <span
              class="absolute inset-0 flex items-center justify-center text-[16px] font-light leading-6 transition-colors duration-300"
              :class="active === i ? 'text-black' : 'text-black/50'"
            >{{ i + 1 }}</span>
          </button>
          </div>

          <div class="pointer-events-auto relative z-10 flex min-w-0 flex-1 flex-col gap-[2px]">
            <button
              v-for="(it, i) in items"
              :key="`v-${i}`"
              type="button"
              class="hero-rise flex w-full flex-col gap-[2px] rounded-[12px] p-4 text-left transition-[background-color,box-shadow] duration-300 cursor-pointer"
              :style="{ animationDelay: `${0.1 + i * 0.08}s` }"
              :class="active === i
                ? 'bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.05)]'
                : 'hover:bg-[#f3fafb]'"
              @click="active = i"
            >
              <h3
                class="text-[16px] leading-7 transition-colors duration-300"
                :class="active === i ? 'font-normal text-[#2de0c6]' : 'font-normal text-[rgba(0,0,0,0.6)]'"
              >
                {{ it.title }}
              </h3>
              <p
                class="text-[14px] font-light leading-6 transition-colors duration-300"
                :class="active === i ? 'text-[rgba(0,0,0,0.6)]' : 'text-[rgba(0,0,0,0.4)]'"
              >
                {{ it.body }}
              </p>
            </button>
          </div>
        </div>

        <div class="relative z-10 flex flex-col gap-2 md:hidden">
          <div
            v-for="(it, i) in items"
            :key="`vs-${i}`"
            class="hero-rise flex w-full flex-col gap-[2px] rounded-[12px] bg-white p-4 shadow-[0px_0px_20px_0px_rgba(0,0,0,0.05)]"
            :style="{ animationDelay: `${0.1 + i * 0.08}s` }"
          >
            <h3 class="text-[16px] font-normal leading-7 text-[rgba(0,0,0,0.6)]">
              {{ it.title }}
            </h3>
            <p class="text-[14px] font-light leading-6 text-[rgba(0,0,0,0.4)]">
              {{ it.body }}
            </p>
          </div>
        </div>

        <div class="relative z-10 hidden grid-cols-2 gap-2 md:grid lg:hidden">
          <button
            v-for="(it, i) in items"
            :key="`m-${i}`"
            type="button"
            class="hero-rise flex w-full flex-col gap-2 rounded-[12px] p-2 text-left transition-[background-color,box-shadow] duration-300 cursor-pointer md:p-4"
            :style="{ animationDelay: `${0.1 + i * 0.08}s` }"
            :class="active === i
              ? 'bg-white shadow-[0px_0px_20px_0px_rgba(0,0,0,0.05)]'
              : 'hover:bg-[#f3fafb]'"
            @click="active = i"
          >
            <h3
              class="text-[16px] leading-7 transition-colors duration-300"
              :class="active === i ? 'font-normal text-[#2de0c6]' : 'font-normal text-[rgba(0,0,0,0.6)]'"
            >
              {{ it.title }}
            </h3>
            <p
              class="text-[14px] font-light leading-6 transition-colors duration-300"
              :class="active === i ? 'text-[rgba(0,0,0,0.6)]' : 'text-[rgba(0,0,0,0.4)]'"
            >
              {{ it.body }}
            </p>
          </button>
        </div>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] hidden h-[310px] bg-gradient-to-b from-transparent to-white md:block" />
  </section>
</template>

<style scoped>
.spine-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: spine-draw 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes spine-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
