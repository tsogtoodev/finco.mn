<script setup lang="ts">
// CEO message (Figma 1:12393) — heading + subtext, then a 2-up: portrait card
// (left, purple wash) and a greeting card (right) carrying the long message,
// tagline and signature. Purple radiant swirls drift in behind.
import type { AboutContent } from '~/composables/useAboutContent'
import signature from '~/assets/images/about-ceo-signature.png'

defineProps<{ ceo: AboutContent['ceo'] }>()
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfb]">
    <!-- purple swirl decoration, upper-right -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-0">
      <div class="absolute -right-32 -top-32 size-[640px] rounded-full bg-[#a78bfa]/20 blur-[140px]" />
      <div class="absolute -left-40 top-1/3 size-[420px] rounded-full bg-[#c4b5fd]/20 blur-[130px]" />
    </div>

    <div class="relative mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-32">
      <MotionReveal class="max-w-3xl">
        <h2 class="font-display text-3xl font-normal leading-tight text-[#141414] sm:text-4xl">
          {{ ceo.headingLead }}<span class="text-[#4c41d8]">{{ ceo.headingAccent }}</span>
        </h2>
        <p class="mt-6 max-w-3xl text-lg font-extralight leading-7 text-[rgba(0,0,0,0.6)] sm:text-xl">
          {{ ceo.subheading }}
        </p>
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

        <!-- Greeting card — A4 letter sheet (210:297) -->
        <MotionReveal
          :delay="0.1"
          class="relative z-10 mx-auto mt-6 flex aspect-[210/297] w-full max-w-[520px] flex-col rounded-[2rem] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.1)] sm:p-10 lg:mx-0 lg:-ml-16 lg:mt-0 lg:max-w-[560px] lg:self-center lg:p-14"
        >
          <!-- tilted duplicate card peeking out behind the letter -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 -z-10 rotate-[6.46deg] rounded-[2rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          />
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          />
          <h3 class="text-lg font-medium text-[#141414]">{{ ceo.greetingTitle }}</h3>
          <div class="mt-5 space-y-4 overflow-y-auto text-sm font-light leading-6 text-[rgba(0,0,0,0.7)]">
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
