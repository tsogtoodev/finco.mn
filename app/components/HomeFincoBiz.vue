<script setup lang="ts">
// FincoBiz showcase (Figma 1:14224): FincoBiz wordmark + intro + accent CTA,
// then the layered platform-UI mockup with an overlaid callout card.
const { t } = useI18n()
</script>

<template>
  <section class="relative overflow-hidden bg-white py-24 lg:py-28">
    <div class="pointer-events-none absolute inset-0 [background:radial-gradient(55%_45%_at_72%_58%,rgba(76,65,216,0.07),transparent_70%)]" />

    <div class="relative mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div class="max-w-[750px]">
          <img src="/images/home/fincobiz-logo.svg" alt="FincoBiz" class="h-10 w-auto">
          <p class="mt-4 text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
            {{ t('home.fincobiz.subtext') }}
          </p>
        </div>
        <AppButton to="/business" variant="accent" pill arrow class="shrink-0">
          {{ t('common.learnMore') }}
        </AppButton>
      </MotionReveal>

      <MotionReveal :delay="0.1" class="relative mt-12">
        <NuxtImg
          src="/images/home/fincobiz-mockup.png"
          :alt="t('home.fincobiz.calloutHeading')"
          sizes="1200px"
          class="w-full"
        />
        <!-- Live callout overlaying the mockup's left panel (covers baked text) -->
        <div class="absolute left-[4%] top-[27%] hidden w-[30%] bg-white p-1 lg:block">
          <h3 class="font-display text-2xl font-semibold leading-8 tracking-[0.01em] text-black">
            {{ t('home.fincobiz.calloutHeading') }}
          </h3>
          <p class="mt-3 text-sm font-light leading-6 text-black/60">
            {{ t('home.fincobiz.calloutSubtext') }}
          </p>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>
