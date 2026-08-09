<script setup lang="ts">
import type { AboutContent } from '~/composables/useAboutContent'
import signature from '~/assets/images/about-ceo-signature.png'

defineProps<{ ceo: AboutContent['ceo'] }>()

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
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfb]">
    <!-- purple swirl decoration, upper-right -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-0">
      <div class="absolute -right-32 -top-32 size-[640px] rounded-full bg-[#a78bfa]/20 blur-[140px]" />
      <div class="absolute -left-40 top-1/3 size-[420px] rounded-full bg-[#c4b5fd]/20 blur-[130px]" />
    </div>

    <div class="relative mx-auto max-w-7xl px-4 py-[120px]">
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
            <!-- <img :src="signature" alt="" class="h-12 w-auto opacity-90"> -->
            <span class="text-base font-semibold text-[#141414]">{{ ceo.signatureName }}</span>
          </div>
        </MotionReveal>
      </div>
    </div>
  </section>
</template>
