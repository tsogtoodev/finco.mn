<script setup lang="ts">
// Mission + vision (Figma 571:6478) — near-black section pinned while the copy
// column scrolls through it, revealing the second badge/heading/body block.
//
// In Figma this is the inner text frame (571:6500) set to `overflowDirection:
// VERTICAL` inside a fixed 1080px clipped section: the background art is a
// SIBLING of that scrolling frame, so it stays put while only the copy moves.
// The web equivalent is a pinned (sticky) scroll section — a tall track whose
// stage is `sticky top-0 h-screen`, with the column translated by scroll
// progress. Design geometry: column viewport 808/1080 of the stage (74.8vh),
// blocks 527px apart (48.8vh), travel = the second block's offset so it lands
// at the top of the viewport at full scroll.
//
// The pin is progressive enhancement: SSR and `prefers-reduced-motion` render
// both blocks stacked in normal flow, so the copy is never hidden behind a
// scroll effect that didn't run.
import type { BadgeBlock } from '~/composables/useAboutContent'
import torus from '~/assets/images/about-mission-torus.svg'
import fractalGlow from '~/assets/images/about-mission-fractal-glow.png'

defineProps<{ blocks: BadgeBlock[] }>()

const trackEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)

const enabled = ref(false) // mounted + motion allowed → pinned layout
const travel = ref(0) // px the column travels across the pin
const offset = ref(0)

// Staggered reveal for every block after the first: each one's badge/heading/body
// rise in once the block has scrolled far enough up the column viewport. The
// first block is already on screen when the pin starts, so it never animates.
const blockTops = ref<number[]>([])
const viewportH = ref(0)
const revealed = ref<boolean[]>([])
// Fire as the block enters the lower part of the column viewport, so its stagger
// plays while it rises into view. Waiting until it is high up the viewport leaves
// the middle of the pin looking empty (the block sits at opacity 0 until then).
const REVEAL_AT = 0.8

let resizeObserver: ResizeObserver | null = null

// Travel = the last block's offset inside the column, so at full scroll it sits
// exactly where the first one started. `offsetTop` is relative to `innerEl`
// because that element is positioned.
function measure() {
  const inner = innerEl.value
  if (!inner) return
  const kids = [...inner.children] as HTMLElement[]
  blockTops.value = kids.map(k => k.offsetTop)
  viewportH.value = inner.parentElement?.clientHeight ?? 0
  travel.value = kids.length > 1 ? (kids[kids.length - 1]?.offsetTop ?? 0) : 0
  if (revealed.value.length !== kids.length) revealed.value = kids.map(() => false)
  syncOffset()
}

// Track height is `100vh + travel`, so the track's negative top offset maps 1:1
// onto the column's travel for the whole time the stage is pinned.
function syncOffset() {
  const el = trackEl.value
  if (!el || !travel.value) {
    offset.value = 0
    return
  }
  offset.value = Math.min(Math.max(-el.getBoundingClientRect().top, 0), travel.value)

  // Latch each block's reveal once it has risen past REVEAL_AT of the viewport.
  // Latched (never re-hides) so scrolling back up doesn't replay or flicker.
  const trigger = viewportH.value * REVEAL_AT
  blockTops.value.forEach((top, i) => {
    if (i > 0 && !revealed.value[i] && offset.value >= top - trigger) revealed.value[i] = true
  })
}

// rAF-throttled: the handler reads getBoundingClientRect, so running it on every
// scroll event forces a synchronous layout per event and janks the scroll.
let rafId = 0
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    syncOffset()
  })
}

// First block is on screen when the pin starts, so it never animates.
const revealClass = (i: number) => {
  if (!enabled.value || i === 0) return ''
  return revealed.value[i] ? 'carousel-reveal' : 'carousel-pre'
}
const revealStyle = (i: number, step: number) =>
  enabled.value && i > 0 && revealed.value[i] ? { animationDelay: `${step * 80}ms` } : undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  enabled.value = true
  nextTick(() => {
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    if (typeof ResizeObserver !== 'undefined' && innerEl.value) {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(innerEl.value)
    }
  })
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', measure)
  resizeObserver?.disconnect()
})
</script>

<template>
  <!-- Track. `overflow-hidden` must NOT live here — an overflow-hidden ancestor
       turns into the sticky element's scrollport and kills the pin; the stage
       below clips the art instead. -->
  <section
    ref="trackEl"
    class="relative bg-[#000] text-white"
    :style="enabled && travel ? { height: `calc(100vh + ${travel}px)` } : undefined"
  >
    <!-- Stage: holds the background art and stays put while the column scrolls. -->
    <div
      class="relative isolate flex flex-col justify-center overflow-hidden"
      :class="enabled ? 'sticky top-0 h-screen' : 'py-24 sm:py-28'"
    >
      <div class="relative mx-auto w-full max-w-7xl px-4">
        <!-- Column viewport: clips the travelling copy when pinned; plain flow
             otherwise so both blocks stay readable without JS. -->
        <div :class="enabled ? 'h-[100vh] overflow-hidden py-24' : ''">
          <div
            ref="innerEl"
            class="relative flex max-w-[654px] flex-col"
            :class="enabled ? 'gap-[70vh] will-change-transform' : 'gap-20 lg:gap-32'"
            :style="enabled ? { transform: `translateY(${-offset}px)` } : undefined"
          >
            <!-- Blocks after the first stagger their badge → heading → body in
                 as they scroll up (shared .carousel-reveal, 80ms apart). -->
            <div v-for="(b, i) in blocks" :key="i" class="flex flex-col gap-6">
              <span
                class="inline-flex w-fit items-center rounded-[24px] bg-white/20 px-4 py-1.5 text-base font-normal leading-5 text-white"
                :class="revealClass(i)"
                :style="revealStyle(i, 0)"
              >
                {{ b.badge }}
              </span>
              <h2
                class="font-display text-[28px] font-semibold leading-[38px] tracking-[0.4px] sm:text-[40px] sm:leading-[54px]"
                :class="revealClass(i)"
                :style="revealStyle(i, 1)"
              >
                {{ b.heading }}
              </h2>
              <p
                class="text-lg font-extralight leading-7 tracking-[0.2px] text-white/80 sm:text-[20px] sm:leading-[32px]"
                :class="revealClass(i)"
                :style="revealStyle(i, 2)"
              >
                {{ b.body }}
              </p>
            </div>
          </div>
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
          v-if="false"
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
                scene="https://prod.spline.design/d6X47aZ7JVftxvE2/scene.splinecode"
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
        <!-- <div class="absolute -bottom-24 -left-24 size-[420px] rounded-full bg-[#214784]/25 blur-[120px]" /> -->
      </div>
    </div>
  </section>
</template>
