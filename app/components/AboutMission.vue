<script setup lang="ts">
import type { BadgeBlock } from '~/composables/useAboutContent'
import torus from '~/assets/images/about-mission-torus.svg'
import fractalGlow from '~/assets/images/about-mission-fractal-glow.png'

defineProps<{ blocks: BadgeBlock[] }>()

const trackEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)

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

let rafId = 0
function onScroll() {
  if (!enabled.value || rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    syncOffset()
  })
}

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
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', measure, { passive: true })
  if (typeof ResizeObserver !== 'undefined' && innerEl.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(innerEl.value)
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  pinMql?.removeEventListener('change', applyPin)
  reduceMql?.removeEventListener('change', applyPin)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measure)
  resizeObserver?.disconnect()
})
</script>

<template>
  <section
    ref="trackEl"
    class="relative bg-[#000] text-white"
    :style="enabled && travel ? { height: `calc(100vh + ${travel}px)` } : undefined"
  >
    <div
      class="relative isolate flex flex-col justify-center overflow-hidden bg-[#080A12]"
      :class="enabled ? 'sticky top-0 h-screen' : 'py-24 sm:py-28'"
    >
      <div class="relative mx-auto w-full max-w-7xl px-4">
        <div :class="enabled ? 'h-[100vh] overflow-hidden py-24' : ''">
          <div
            ref="innerEl"
            class="relative flex max-w-[578px] flex-col"
            :class="enabled ? 'gap-[70vh] will-change-transform' : 'gap-20 lg:gap-32'"
            :style="enabled ? { transform: `translateY(${-offset}px)` } : undefined"
          >
            <div v-for="(b, i) in blocks" :key="i" class="flex flex-col gap-[16px]">
              <span
                class="inline-flex w-fit items-center rounded-[24px] bg-white/20 px-4 py-1.5 text-[16px] font-normal leading-[20px] text-white"
                :class="revealClass(i)"
                :style="revealStyle(i, 0)"
              >
                {{ b.badge }}
              </span>
              <h2
                class="font-display text-[28px] font-normal leading-[36px] tracking-[0.4px] max-w-[415px]"
                :class="revealClass(i)"
                :style="revealStyle(i, 1)"
              >
                {{ b.heading }}
              </h2>
              <p
                class="text-[18px] font-extralight leading-[24px] tracking-[0.2px] text-white/80"
                :class="revealClass(i)"
                :style="revealStyle(i, 2)"
              >
                {{ b.body }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
        <img
          :src="fractalGlow"
          alt=""
          class="absolute left-0 top-0 h-full w-[59%] max-w-[849px] object-fill"
        >
        <div
          v-if="isDesktop"
          class="pointer-events-auto absolute left-[40%] top-[min(8.894vw,171px)] aspect-video w-[min(79.373vw,1524px)] overflow-hidden bg-[#080A12]"
        >
          <div class="h-[1080px] w-[1920px] mt-[65px] origin-top-left scale-[calc(tan(atan2(min(79.373vw,1524px),1920px)))]">
            <ClientOnly>
              <SplineScene
                scene="https://prod.spline.design/d6X47aZ7JVftxvE2/scene.splinecode"
                no-drag
                :zoom="1"
                class="size-full bg-[#080A12]"
              />
              <template #fallback>
                <img :src="torus" alt="" class="size-full object-cover">
              </template>
            </ClientOnly>
          </div>
        </div>
        <div class="pointer-events-none absolute bottom-0 left-0 h-[min(16.094vw,309px)] w-[46.6%] max-w-[894px] bg-gradient-to-b" />
        <!-- <div class="pointer-events-none absolute bottom-0 left-1/2 h-[min(13.802vw,65px)] w-full max-w-[1910px] -translate-x-1/2 bg-gradient-to-b" /> -->
        <!-- soft blue glow, lower-left -->
        <!-- <div class="absolute -bottom-24 -left-24 size-[420px] rounded-full bg-[#214784]/25 blur-[120px]" /> -->
      </div>
    </div>
  </section>
</template>
