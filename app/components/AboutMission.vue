<script setup lang="ts">
import type { BadgeBlock } from '~/composables/useAboutContent'
import torus from '~/assets/images/about-mission-torus.svg'
import fractalGlow from '~/assets/images/about-mission-fractal-glow.png'

defineProps<{ blocks: BadgeBlock[] }>()

const trackEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)

// Live scene on capable devices, the static torus raster everywhere else.
const splineEnabled = useSplineEnabled()

const enabled = ref(false) // mounted + motion allowed → pinned layout
const travel = ref(0) // px the column travels across the pin
const offset = ref(0)

const blockTops = ref<number[]>([])
const viewportH = ref(0)
const revealed = ref<boolean[]>([]) 
const REVEAL_AT = 0.8

let resizeObserver: ResizeObserver | null = null

function measure() {
  const inner = innerEl.value
  if (!inner || !enabled.value) return
  const kids = [...inner.children] as HTMLElement[]
  blockTops.value = kids.map(k => k.offsetTop)
  viewportH.value = inner.parentElement?.clientHeight ?? 0
  travel.value = kids.length > 1 ? (kids[kids.length - 1]?.offsetTop ?? 0) : 0
  if (revealed.value.length !== kids.length) revealed.value = kids.map(() => false)
  syncOffset()
}

function syncOffset() {
  const el = trackEl.value
  if (!el || !travel.value) {
    offset.value = 0
    return
  }
  offset.value = Math.min(Math.max(-el.getBoundingClientRect().top, 0), travel.value)

  const trigger = viewportH.value * REVEAL_AT
  blockTops.value.forEach((top, i) => {
    if (i > 0 && !revealed.value[i] && offset.value >= top - trigger) revealed.value[i] = true
  })
}

// Bound to the smooth-scroll layer rather than the native `scroll` event, so the
// pinned column moves in the same frame as the page instead of trailing it by one.
// The pin is desktop + motion-allowed only, hence the `enabled` gate.
const pinScroll = useScrollSync(() => {
  if (!enabled.value) return
  syncOffset()
})

const revealClass = (i: number) => {
  if (!enabled.value || i === 0) return ''
  return revealed.value[i] ? 'carousel-reveal' : 'carousel-pre'
}
const revealStyle = (i: number, step: number) =>
  enabled.value && i > 0 && revealed.value[i] ? { animationDelay: `${step * 80}ms` } : undefined

const PIN_MQ = '(min-width: 1024px)'
let pinMql: MediaQueryList | null = null
let reduceMql: MediaQueryList | null = null

// Also gates the decorative Spline slot — see the template.
const isDesktop = ref(false)

function applyPin() {
  isDesktop.value = !!pinMql?.matches
  const on = isDesktop.value && !reduceMql?.matches
  enabled.value = on
  if (!on) {
    // Drop the transform and the track's extra height so the static flow is clean.
    offset.value = 0
    travel.value = 0
    return
  }
  nextTick(measure)
}

onMounted(() => {
  pinMql = window.matchMedia(PIN_MQ)
  reduceMql = window.matchMedia('(prefers-reduced-motion: reduce)')
  applyPin()
  pinMql.addEventListener('change', applyPin)
  reduceMql.addEventListener('change', applyPin)
  pinScroll.start()
  // Separate from pinScroll's own resize hook: this one re-measures the block
  // offsets, which a plain syncOffset does not do.
  window.addEventListener('resize', measure, { passive: true })
  if (typeof ResizeObserver !== 'undefined' && innerEl.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(innerEl.value)
  }
})

onBeforeUnmount(() => {
  pinMql?.removeEventListener('change', applyPin)
  reduceMql?.removeEventListener('change', applyPin)
  window.removeEventListener('resize', measure)
  resizeObserver?.disconnect()
  // pinScroll detaches itself on unmount.
})
</script>

<template>
  <section
    ref="trackEl"
    class="relative bg-[#000] text-white"
    :style="enabled && travel ? { height: `calc(100dvh + ${travel}px)` } : undefined"
  >
    <div
      class="relative isolate flex flex-col justify-center overflow-hidden bg-[#080A12]"
      :class="enabled ? 'sticky top-0 h-[100dvh]' : 'py-24 sm:py-28'"
    >
      <div class="pointer-events-none relative mx-auto w-full max-w-7xl px-4">
        <div :class="enabled ? 'h-[100dvh] overflow-hidden py-24' : ''">
          <div
            ref="innerEl"
            class="relative flex max-w-[578px] flex-col"
            :class="enabled ? 'gap-[70dvh] will-change-transform' : 'gap-20 lg:gap-32'"
            :style="enabled ? { transform: `translateY(${-offset}px)` } : undefined"
          >
            <div v-for="(b, i) in blocks" :key="i" class="pointer-events-auto flex flex-col gap-[16px]">
              <span
                class="inline-flex w-fit items-center rounded-[24px] bg-white/20 px-4 py-1.5 text-[16px] font-normal leading-[20px] text-white"
                :class="revealClass(i)"
                :style="revealStyle(i, 0)"
              >
                {{ b.badge }}
              </span>
              <h2
                class="font-display text-[28px] font-bold leading-[36px] tracking-[0px] max-w-[415px]"
                :class="revealClass(i)"
                :style="revealStyle(i, 1)"
              >
                {{ b.heading }}
              </h2>
              <p
                class="text-[16px] font-extralight leading-[24px] tracking-[0.px] text-white/60"
                :class="revealClass(i)"
                :style="revealStyle(i, 2)"
              >
                {{ b.body }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10"
        :style="{ '--scene-w': 'min(79.373vw, 1524px, calc((100dvh - min(8.894vw, 20px)) * 16 / 9))' }"
      >
        <img
          :src="fractalGlow"
          alt=""
          class="absolute left-0 top-0 h-full w-[45%] max-w-[750px] object-cover object-left [mask-image:linear-gradient(to_right,#000_45%,transparent_100%)]"
          :style="isDesktop ? { width: 'calc(100% - var(--scene-w))' } : undefined"
        >
        <div
          v-if="isDesktop"
          class="pointer-events-auto absolute bottom-0 right-0 aspect-video overflow-hidden bg-[#080A12] h-[100dvh]"
          :style="{ width: 'var(--scene-w)' }"
        >
          <div
            class="h-[1080px] w-[1920px]"
          >
            <SplineScene
              v-if="splineEnabled"
              scene="https://prod.spline.design/5QI6kS8kPdn7j7Y3/scene.splinecode?timestamp=20260810040000"
              preload
              defer-until-lcp
              :zoom="1"
              class="bg-[#080A12]"
              style="width: 100dvw; height: 100dvh; object-fit: cover;"
            />
            <img v-else :src="torus" alt="" class="size-full object-cover">
          </div>

          <!-- Top-right gradient for the scene -->
          <!-- <div
            aria-hidden="true"
            class="pointer-events-none absolute right-0 top-0 h-[45%] w-[45%]"
            :style="{
              backgroundImage: `linear-gradient(to bottom left,
                #080A12 0%,
                #080A12 26%,
                rgba(8,10,18,0.82) 46%,
                rgba(8,10,18,0.45) 68%,
                rgba(8,10,18,0.15) 86%,
                rgba(8,10,18,0) 100%)`,
            }"
          /> -->
          <!-- Bottom gradient for the scene -->
          <!-- <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-0 bottom-0 h-[28%]"
            :style="{
              backgroundImage: `linear-gradient(to top,
                #080A12 0%,
                #080A12 26%,
                rgba(8,10,18,0.82) 46%,
                rgba(8,10,18,0.45) 68%,
                rgba(8,10,18,0.15) 86%,
                rgba(8,10,18,0) 100%)`,
            }"
          /> -->
        </div>
      </div>
    </div>
  </section>
</template>
