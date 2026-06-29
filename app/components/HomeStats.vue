<script setup lang="ts">
// Stats band (Figma 1:14154): dark #0a0a1a panel, full-bleed colourful wave
// background, centred heading, three count-up stats over it.
//
// Background is a looping video on >= sm, a static poster image on mobile.
// Mobile never downloads the video (preload="none" + JS only plays on desktop),
// so phones avoid the fetch entirely. Desktop plays only while in view and
// honours prefers-reduced-motion (poster stays in both skipped cases). The
// stats-wave.png poster matches the video's first frame, so SSR / loading /
// no-JS / reduced-motion all show the same visual with no flash.
const { t } = useI18n()

const video = ref<HTMLVideoElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const el = video.value
  if (!el) return
  // Skip on mobile or when reduced motion is preferred → poster only, no fetch.
  if (!window.matchMedia('(min-width: 640px)').matches) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) el.play().catch(() => {})
        else el.pause()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(el)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#0a0a1a] px-6 py-6 lg:py-32">
    <!-- Background video (>= sm) -->
    <video
      ref="video"
      poster="/images/home/stats-wave.png"
      muted
      loop
      playsinline
      preload="none"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 hidden size-full object-cover sm:block scale-140 -mt-20"
    >
      <source src="/videos/bg-stats-section.webm" type="video/webm">
      <source src="/videos/bg-stats-section.mp4" type="video/mp4">
    </video>
    <!-- Static poster (mobile only) — avoids the video download on phones -->
    <NuxtImg
      src="/images/home/stats-wave.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full object-cover sm:hidden"
    />

    <div class="relative mx-auto flex w-full max-w-[1200px] flex-col items-center">
      <MotionReveal
        as="h2"
        class="max-w-[1015px] text-center font-display text-2xl font-semibold leading-tight tracking-wide text-white sm:text-[32px]"
      >
        {{ t('home.stats.heading') }}
      </MotionReveal>

      <div class="mt-90 grid w-full grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6">
        <div
          v-for="(s, i) in [
            { value: 71000, label: t('home.stats.customers.label') },
            { value: 70, prefix: '₮', suffix: t('home.stats.funding.unit'), label: t('home.stats.funding.label') },
            { value: 26000, suffix: '+', label: t('home.stats.users.label') },
          ]"
          :key="i"
          class="relative flex flex-col items-center gap-4 text-center"
        >
          <!-- Gradient "drop" line centred in the gap ABOVE each number (Figma
               1:14170–72): colourful at the top, fading to transparent toward
               the number. Sits entirely above the text (bottom-full + gap) so
               it never overlaps the number/label. Desktop only. -->
          <span
            aria-hidden="true"
            class="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden h-20 w-px -translate-x-1/2 sm:block [background:linear-gradient(to_bottom,#3b06cd_0%,#cd06ab_16%,#600a51_32%,rgba(118,70,108,0)_100%)]"
          />
          <p class="font-display text-5xl font-semibold text-white">
            <span v-if="s.prefix">{{ s.prefix }}</span><StatCounter :value="s.value" /><span
              v-if="s.suffix"
              :class="s.prefix ? 'text-2xl' : ''"
            >{{ s.suffix }}</span>
          </p>
          <p class="text-[15px] font-extralight tracking-wide text-white/80">{{ s.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
