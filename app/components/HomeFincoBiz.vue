<script setup lang="ts">
// FincoBiz showcase (Figma 1:14224): FincoBiz wordmark + intro + accent CTA,
// then the layered platform-UI mockup with two white masks that hide the
// mockup's baked left-panel text, overlaid with crisp/translatable live text.
// Callout geometry is expressed as % of the mockup and cqw font sizes so it
// tracks the mockup at any width (the mockup scales below the 1200px design).
const { t } = useI18n()
</script>

<template>
  <section class="relative overflow-hidden bg-white py-24 lg:py-28">
    <div class="pointer-events-none absolute inset-0 [background:radial-gradient(55%_45%_at_72%_58%,rgba(76,65,216,0.07),transparent_70%)]" />

    <div class="relative mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="max-w-[750px]">
          <img src="/images/home/fincobiz-logo.svg" alt="FincoBiz" class="block h-auto w-[190px]">
          <p class="mt-4 text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
            {{ t('home.fincobiz.subtext') }}
          </p>
        </div>
        <AppButton to="/business" variant="accent" pill arrow class="h-10 shrink-0">
          {{ t('common.learnMore') }}
        </AppButton>
      </MotionReveal>

      <MotionReveal :delay="0.1" class="relative mt-24">
        <div class="relative [container-type:inline-size]">
          <NuxtImg
            src="/images/home/fincobiz-mockup.png"
            :alt="t('home.fincobiz.calloutHeading')"
            width="1200"
            height="699"
            sizes="1200px"
            class="w-full"
          />
          <!-- Live callout (desktop): white masks cover the mockup's baked text -->
          <div class="pointer-events-none absolute inset-0 hidden lg:block">
            <div class="absolute bg-white" style="left:3.415%;top:28.149%;width:27.835%;height:12.281%" />
            <div class="absolute bg-white" style="left:4.027%;top:41.876%;width:29.311%;height:15.216%" />
            <h3
              class="absolute whitespace-nowrap font-display font-semibold tracking-[0.01em] text-black"
              style="left:4.496%;top:28.149%;font-size:2.3333cqw;line-height:2.6667cqw"
            >
              {{ t('home.fincobiz.calloutHeading') }}
            </h3>
            <p
              class="absolute font-light tracking-[0.01em] text-black/60"
              style="left:4.496%;top:36.011%;width:35.069%;font-size:1.1667cqw;line-height:2cqw"
            >
              {{ t('home.fincobiz.calloutSubtext') }}
            </p>
          </div>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>
