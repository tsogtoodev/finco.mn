<script setup lang="ts">
// Stats band (Figma 1:14154): dark #0a0a1a panel, full-bleed colourful wave
// graphic, centred heading, three count-up stats over the wave.
const { t } = useI18n()
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#0a0a1a] px-6 py-24 lg:py-32">
    <!-- Wave graphic -->
    <NuxtImg
      src="/images/home/stats-wave.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-1/2 h-full min-h-[700px] w-auto min-w-full max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
    />
    <!-- Edge fades blending the wave into the panel -->
    <div class="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[#0a0a1a] to-transparent" />
    <div class="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[#0a0a1a] to-transparent" />

    <div class="relative mx-auto flex w-full max-w-[1200px] flex-col items-center">
      <MotionReveal
        as="h2"
        class="max-w-[1015px] text-center font-display text-2xl font-semibold leading-tight tracking-wide text-white sm:text-[32px]"
      >
        {{ t('home.stats.heading') }}
      </MotionReveal>

      <div class="mt-[clamp(8rem,22vw,18rem)] grid w-full grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6">
        <div
          v-for="(s, i) in [
            { value: 71000, label: t('home.stats.customers.label') },
            { value: 70, prefix: '₮', suffix: t('home.stats.funding.unit'), label: t('home.stats.funding.label') },
            { value: 26000, suffix: '+', label: t('home.stats.users.label') },
          ]"
          :key="i"
          class="flex flex-col items-center gap-4 text-center sm:relative"
          :class="i > 0 ? 'sm:before:absolute sm:before:-left-3 sm:before:top-1/2 sm:before:h-28 sm:before:w-px sm:before:-translate-y-[140%] sm:before:bg-gradient-to-b sm:before:from-transparent sm:before:via-white/20 sm:before:to-transparent' : ''"
        >
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
