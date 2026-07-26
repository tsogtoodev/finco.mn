<script setup lang="ts">
import type { AboutContent } from '~/composables/useAboutContent'
import signature from '~/assets/images/about-ceo-signature.png'

defineProps<{ ceo: AboutContent['ceo'] }>()

const TILT_MAX = 6.46
const letterRef = ref<{ $el?: HTMLElement } | null>(null)
const tilted = ref(false)
let observer: IntersectionObserver | null = null

const FRACTAL_RAMP = `linear-gradient(to right,
  rgb(188,181,250) 0%,
  rgb(220,217,249) 22%,
  rgb(223,220,249) 40%,
  rgb(166,161,237) 62%,
  rgb(139,201,228) 82%,
  rgb(154,217,231) 100%)`
const FRACTAL_LAYERS = [
  { t: 0, o: 0.1 },
  { t: 20, o: 0.16 },
  { t: 40, o: 0.18 },
  { t: 60, o: 0.2 },
  { t: 80, o: 0.22 },
] as const

const FRACTAL_MIN = 0.35
const bandEl = ref<HTMLElement | null>(null)
const fs = ref(1)

function syncFractal() {
  const el = bandEl.value
  if (!el) return
  const vh = window.innerHeight || 1
  const p = Math.min(Math.max((vh - el.getBoundingClientRect().top) / vh, 0), 1)
  fs.value = 1 - p * (1 - FRACTAL_MIN)
}

let rafId = 0
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    syncFractal()
  })
}

onMounted(() => {
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  if (!reduced) {
    syncFractal()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  }

  if (reduced) {
    tilted.value = true
    return
  }
  const el = letterRef.value?.$el
  if (!el) return
  observer = new IntersectionObserver(([entry]) => {
    const r = entry.boundingClientRect
    const vh = window.innerHeight || document.documentElement.clientHeight
    const fullyInView = (r.top >= 0 && r.bottom <= vh) || (r.top <= 0 && r.bottom >= vh)
    if (fullyInView) {
      tilted.value = true
      observer?.disconnect()
      observer = null
    }
  }, { threshold: [0, 0.5, 0.9, 0.99, 1] })
  observer.observe(el)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
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
      :style="{ '--fs': fs, height: 'calc(min(10.417vw, 200px) * var(--fs))', background: 'linear-gradient(180deg, rgba(76, 65, 216, 0.03) 0%, rgba(255, 255, 255, 0.03) 100%)', backdropFilter: 'blur(80px)' }"
    >
      <div style="background: linear-gradient(180deg, rgba(76, 65, 216, 0.03) 0%, rgba(255, 255, 255, 0.03) 100%); backdrop-filter: blur(80px); width: 100%; height: 100%; position: absolute; left: 0; top: 0;"></div>
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
          ref="letterRef"
          :delay="0.1"
          class="relative z-10 mx-auto mt-6 flex w-full max-w-[520px] flex-col rounded-[2rem] bg-white px-8 py-6 shadow-[0_4px_24px_rgba(0,0,0,0.1)] sm:px-10 sm:py-8 lg:mx-0 lg:-ml-16 lg:mt-0 lg:aspect-[210/272] lg:max-w-[560px] lg:self-center lg:px-14 lg:py-10"
        >
          <!-- duplicate card peeking out behind the letter; tilts in when fully in view -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)] will-change-transform"
            :style="{ transform: `rotate(${tilted ? TILT_MAX : 0}deg)`, transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' }"
          />
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          />
          <h3 class="text-lg font-medium text-[#141414]">{{ ceo.greetingTitle }}</h3>
          <div class="mt-5 space-y-4 text-sm font-light leading-6 text-[rgba(0,0,0,0.7)] lg:overflow-y-auto">
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
