<script setup lang="ts">
// Stats band (Figma 1:14154): dark #0a0a1a panel, full-bleed 3D Spline scene
// background, centred heading, three count-up stats over it.
//
// Background is an interactive Spline scene on >= sm, a static poster image on
// mobile. The WebGL scene is client-only (ClientOnly) and never loaded on
// phones — they keep the lightweight stats-wave.png poster, which also serves
// as the SSR / no-JS / load-in-progress fallback so there's no flash.
const { t } = useI18n()
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#0a0a1a] px-6 py-6 lg:py-32">
    <!-- Background Spline scene (>= sm). pointer-events-none → pure backdrop,
         no drag/orbit; ClientOnly keeps WebGL off the server and shows the
         poster until the scene has loaded. -->
    <div class="pointer-events-none absolute inset-0 hidden size-full scale-120 sm:block -mt-20">
      <ClientOnly>
        <SplineScene scene="/_tmp-stats-scene.splinecode" no-drag />
        <template #fallback>
          <NuxtImg
            src="/images/home/stats-wave.png"
            alt=""
            aria-hidden="true"
            class="size-full object-cover"
          />
        </template>
      </ClientOnly>
    </div>
    <!-- Static poster (mobile only) — avoids the WebGL payload on phones -->
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
          class="relative flex flex-col items-center gap-2 text-center"
        >
          <!-- Gradient "drop" line centred in the gap ABOVE each number (Figma
               1:14170–72): colourful at the top, fading to transparent toward
               the number. Sits entirely above the text (bottom-full + gap) so
               it never overlaps the number/label. Desktop only. -->
          <span
            aria-hidden="true"
            class="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden h-20 w-px -translate-x-1/2 sm:block [background:linear-gradient(to_bottom,#3b06cd_0%,#cd06ab_16%,#600a51_32%,rgba(118,70,108,0)_100%)]"
          />
          <p class="font-display text-5xl font-semibold text-white leading-tight">
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
