<script setup lang="ts">
// Contact CTA (Figma 1:14351): near-black panel, heading + subtext + white pill,
// floating 3D Finco-card graphic on the right.
const { t } = useI18n()
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#080a12]">
    <!-- Far-left blue glow -->
    <div class="pointer-events-none absolute inset-y-0 left-0 w-1/3 [background:radial-gradient(60%_80%_at_0%_50%,rgba(33,71,132,0.35),transparent_70%)]" />
    <div
      class="absolute right-0 top-1/2 hidden h-[100%] w-[65%] max-w-[820px] -translate-y-1/2 md:block"
    >
      <ClientOnly>
        <SplineScene scene="https://prod.spline.design/rAfqlL9pnx29yw5P/scene.splinecode" no-drag />
        <template #fallback>
          <NuxtImg
            src="/images/home/contact-cards.png"
            alt=""
            sizes="820px"
            class="pointer-events-none absolute inset-0 top-1/2 size-full -translate-y-1/2 object-contain"
          />
        </template>
      </ClientOnly>
    </div>

    <!-- Blend scrim: fades the panel colour over the scene's left edge so the
         3D scene emerges from the dark instead of meeting it at a hard seam.
         Solid through the text column, transparent over the cards on the right. -->
    <div
      class="pointer-events-none absolute inset-0 [background:linear-gradient(90deg,#080a12_0%,#080a12_38%,rgba(8,10,18,0.85)_50%,rgba(8,10,18,0)_72%)]"
    />

    <!-- pointer-events-none lets mouse drag/click pass through to the Spline
         canvas on the right; the text column re-enables events for the CTA. -->
    <div class="pointer-events-none relative mx-auto w-full max-w-[1200px] px-6 py-24 lg:py-42">
      <MotionReveal class="pointer-events-auto flex max-w-[620px] flex-col items-start gap-16">
        <div class="flex flex-col gap-4">
          <h2 class="font-display text-3xl font-medium leading-tight text-white sm:text-[40px] sm:leading-[48px]">
            {{ t('home.contact.heading') }}
          </h2>
          <p class="max-w-[605px] text-xl font-extralight leading-8 tracking-[0.01em] text-white/80 sm:text-2xl">
            {{ t('home.contact.subtext') }}
          </p>
        </div>
        <AppButton to="/branches" variant="light" pill arrow>
          {{ t('home.contact.cta') }}
        </AppButton>
      </MotionReveal>
    </div>
  </section>
</template>
