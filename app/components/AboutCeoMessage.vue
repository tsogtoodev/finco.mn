<script setup lang="ts">
import type { AboutContent } from '~/composables/useAboutContent'
import signature from '~/assets/images/about-ceo-signature.png'

defineProps<{ ceo: AboutContent['ceo'] }>()

// Matches Figma (node 775:10214): each band is a vertical indigo→white gradient
// at a uniform low alpha (see FRACTAL_LAYERS). The per-layer opacity carries the
// alpha, so the gradient itself is full-opacity indigo → white top→bottom.
const FRACTAL_RAMP = `linear-gradient(to bottom,
  rgb(76, 65, 216) 0%,
  rgb(255, 255, 255) 100%)`
// Five bands at 0/20/40/60/80% down, each 3% alpha. Figma (775:10214) uses 5%
// per band (topmost 3%); dialled down to a uniform 3% here per design direction
// for a subtler stack.
const FRACTAL_LAYERS = [
  { t: 0, o: 0.03 },
  { t: 20, o: 0.03 },
  { t: 40, o: 0.03 },
  { t: 60, o: 0.03 },
  { t: 80, o: 0.03 },
] as const

// Colour-glow ellipses behind the steps (Figma 775:10211–10213). Each is a
// 30%-opacity solid ellipse seen through the band's 80px blur; reproduced here
// as a blurred solid ellipse. Geometry is Figma's (frame 1920×200) expressed as
// % of the band — centre (cx,cy), size (w,h) — so the pools sit along the bottom
// edge and rise into view exactly as designed. The frame clips them (the band's
// overflow-hidden does the same here).
const FRACTAL_GLOWS = [
  { cx: 0, cy: 140, w: 44.9, h: 136.5, color: 'rgb(140, 131, 255)' }, // periwinkle, left
  { cx: 63.2, cy: 160, w: 44.9, h: 136.5, color: 'rgb(76, 65, 216)' }, // indigo, centre-right
  { cx: 88.2, cy: 140, w: 37.2, h: 69.2, color: 'rgb(45, 224, 198)' }, // teal, right
] as const

const FRACTAL_MIN = 0.35
const bandEl = ref<HTMLElement | null>(null)
const fs = ref(1)

// The letter body is an inner scroller inside a Lenis-driven page. It used to
// carry `data-lenis-prevent`, which opts the whole subtree out of the smooth
// layer — but with `allowNestedScroll: false` that made the wheel a DEAD ZONE:
// once the letter hit its own top/bottom (or when it isn't overflowing at all)
// nothing moved, so the page froze while the cursor sat over it.
//
// Instead, claim the wheel only while the letter still has room to travel in
// that direction; at the edges the event bubbles on to Lenis and the page
// scrolls as usual. Lenis listens on the window, so stopping propagation here
// (bubble phase) is what keeps the page still during the letter's own scroll.
const letterBody = ref<HTMLElement | null>(null)

function onLetterWheel(e: WheelEvent) {
  const el = letterBody.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return
  const atTop = el.scrollTop <= 0
  const atBottom = el.scrollTop >= max - 1
  if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) return
  e.preventDefault()
  e.stopPropagation()
  el.scrollTop += e.deltaY
}

function syncFractal() {
  const el = bandEl.value
  if (!el) return
  const vh = window.innerHeight || 1
  const p = Math.min(Math.max((vh - el.getBoundingClientRect().top) / vh, 0), 1)
  fs.value = 1 - p * (1 - FRACTAL_MIN)
}

// Drives the fractal off the smooth-scroll layer so it tracks the page in the
// same frame rather than a frame behind. Also owns the resize listener.
const fractalScroll = useScrollSync(syncFractal)

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  syncFractal()
  // useScrollSync detaches its own listeners on unmount.
  fractalScroll.start()
})
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfb]">
    <!-- purple swirl decoration, upper-right -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-0">
      <div class="absolute -right-32 -top-32 size-[640px] rounded-full bg-[#a78bfa]/20 blur-[140px]" />
      <div class="absolute -left-40 top-1/3 size-[420px] rounded-full bg-[#c4b5fd]/20 blur-[130px]" />
    </div>

    <div
      ref="bandEl"
      aria-hidden="true"
      class="pointer-events-none relative z-0 w-full overflow-hidden"
      :style="{ '--fs': fs, height: 'calc(min(10.417vw, 200px) * var(--fs))', background: 'rgb(239, 238, 253)', backdropFilter: 'blur(80px)' }"
    >
      <!-- <div style="background: linear-gradient(180deg, rgba(76, 65, 216, 0.03) 0%, rgba(255, 255, 255, 0.03) 100%); backdrop-filter: blur(80px); width: 100%; height: 100%; position: absolute; left: 0; top: 0;"></div> -->
      <!-- Colour-glow ellipses (Figma 775:10211–10213), behind the step layers. -->
      <div
        v-for="(g, i) in FRACTAL_GLOWS"
        :key="`glow-${i}`"
        class="absolute rounded-full"
        :style="{
          left: `${g.cx}%`,
          top: `${g.cy}%`,
          width: `${g.w}%`,
          height: `${g.h}%`,
          transform: 'translate(-50%, -50%)',
          background: g.color,
          opacity: 0.3,
          filter: 'blur(80px)',
        }"
      />
      <div
        v-for="(l, i) in FRACTAL_LAYERS"
        :key="i"
        class="absolute inset-x-0 bottom-0"
        :style="{ top: `${l.t}%`, opacity: l.o, backgroundImage: FRACTAL_RAMP }"
      />
    </div>

    <div class="relative mx-auto max-w-7xl px-4 py-[80px]">
      <MotionReveal class="max-w-4xl">
        <h2 class="font-display text-3xl font-normal leading-tight text-[#141414] sm:text-4xl">
          {{ ceo.headingLead }}<span class="text-[#4c41d8]">{{ ceo.headingAccent }}</span>
        </h2>
        <!-- <p class="mt-6 max-w-4xl text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl">
          {{ ceo.subheading }}
        </p> -->
      </MotionReveal>

      <div class="mt-12 lg:mt-20 lg:flex lg:items-stretch lg:items-center lg:justify-center">
        <!-- Portrait -->
        <MotionReveal
          class="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#f9f9f9] sm:aspect-[3/2] lg:aspect-auto lg:w-[50%] lg:shrink-0"
        >
          <NuxtImg
            :src="ceo.portrait"
            :alt="`${ceo.signatureName} — ${ceo.signatureLabel}`"
            width="832"
            height="1008"
            class="size-full object-cover object-top"
          />
          <div
            aria-hidden="true"
            class="absolute inset-0"
            style="background: linear-gradient(to bottom, rgba(84,87,220,0) 69%, rgba(84,87,220,0.4));"
          />
        </MotionReveal>

        <!-- Greeting card — letter sheet, A4-ish but a touch shorter (210:272) -->
        <MotionReveal
          :delay="0.1"
          class="relative z-10 mx-auto mt-6 flex w-full max-w-[520px] flex-col rounded-[2rem] bg-white px-8 py-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)] sm:px-10 sm:py-8 lg:mx-0 lg:-ml-16 lg:mt-0 lg:aspect-[210/272] lg:max-w-[560px] lg:self-center lg:px-14 lg:py-10"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          />
          <h3 class="text-lg font-medium text-[#141414]">{{ ceo.greetingTitle }}</h3>
          <!-- See onLetterWheel: this scroller cooperates with Lenis rather than
               opting out of it, so the page still scrolls at the letter's edges. -->
          <div
            ref="letterBody"
            class="mt-5 space-y-4 text-sm font-light leading-6 text-[rgba(0,0,0,0.7)] lg:overflow-y-auto"
            @wheel="onLetterWheel"
          >
            <p v-for="(para, i) in ceo.greetingBody" :key="i">{{ para }}</p>
          </div>
          <p class="mt-6 text-sm font-medium text-[#4c41d8]">{{ ceo.tagline }}</p>
          <div class="mt-auto flex items-center justify-end gap-4 pt-6">
            <span class="text-sm text-[rgba(0,0,0,0.6)]">{{ ceo.signatureLabel }}</span>
            <img :src="signature" alt="" class="h-12 w-auto opacity-90">
            <span class="text-base font-semibold text-[#141414]">{{ ceo.signatureName }}</span>
          </div>
        </MotionReveal>
      </div>
    </div>
  </section>
</template>
