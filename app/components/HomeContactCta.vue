<script setup lang="ts">
// Contact CTA (Figma 1:14351): near-black panel, heading + subtext + white pill,
// floating 3D Finco-card graphic on the right. Clicking the card scene opens
// the feedback dialog (Figma 464:10744).
const { t } = useI18n()

const feedbackOpen = ref(false)

// Live card scene on capable devices, the matching raster everywhere else.
const splineEnabled = useSplineEnabled()
</script>

<template>
  <section class="relative isolate flex h-[350px] items-center overflow-hidden bg-[#080a12]">
    <!-- Far-left blue glow -->
    <div class="pointer-events-none absolute inset-y-0 left-0 w-1/3 [background:radial-gradient(60%_80%_at_0%_50%,rgba(33,71,132,0.35),transparent_70%)]" />
    <!-- lg, not md. The blend scrim below is a gradient over the SECTION width
         (opaque to 38%, clear by 72%), so how much scene shows through the text
         depends on the ratio of scene width to section width. At 1440 that lands
         the artwork behind only the tail of a short heading; at 768 the scene is
         614px anchored right (x 154→768) against a text column running x 24→644,
         with the scrim already fading from 292px — so ~350px of the heading and
         CTA sat over visible card artwork. Tablet is not a designed breakpoint
         here (Figma is 1440), so it gets the clean dark panel instead. -->
    <div
      class="absolute right-0 top-1/2 hidden h-[100%] w-[80%] max-w-[1040px] -translate-y-1/2 cursor-pointer lg:block"
      @click="feedbackOpen = true"
    >
      <!-- Left at 1x: unlike the other scenes this one is a crisp card graphic, so
           the edges matter. Its cost is draw calls (413/frame from 26 objects), not
           pixels — only merging meshes in the Spline editor moves that. -->
      <SplineScene
        v-if="splineEnabled"
        scene="https://prod.spline.design/rAfqlL9pnx29yw5P/scene.splinecode?timestamp=1754266000"
        no-drag
        preload
        defer-until-lcp
        :zoom="2"
      />
      <NuxtImg
        v-else
        src="/images/home/contact-cards.png"
        alt=""
        sizes="820px"
        class="pointer-events-none absolute inset-0 top-1/2 size-full -translate-y-1/2 object-contain"
      />
    </div>

    <!-- Blend scrim: fades the panel colour over the scene's left edge so the
         3D scene emerges from the dark instead of meeting it at a hard seam.
         Solid through the text column, transparent over the cards on the right. -->
    <div
      class="pointer-events-none absolute inset-0 [background:linear-gradient(90deg,#080a12_0%,#080a12_38%,rgba(8,10,18,0.85)_50%,rgba(8,10,18,0)_72%)]"
    />

    <!-- pointer-events-none lets mouse drag/click pass through to the Spline
         canvas on the right; the text column re-enables events for the CTA. -->
    <div class="pointer-events-none relative mx-auto w-full max-w-[1200px] px-6 lg:px-0">
      <MotionReveal class="pointer-events-auto flex max-w-[620px] flex-col items-start gap-8">
        <div class="flex flex-col gap-4">
          <h2 class="font-display text-3xl font-medium leading-tight text-white sm:text-[40px] sm:leading-[48px]">
            {{ t('home.contact.heading') }}
          </h2>
          <!-- Was `text-xl leading-[20px] sm:text-[16px]` — mobile-first inverted:
               20px type with a 20px line-height on phones, shrinking to 16px on
               larger screens. The Mongolian string wraps to ~4 lines at 327px, so
               Cyrillic ascenders and descenders collided between them. -->
          <p class="max-w-[605px] text-base font-extralight leading-6 tracking-[0.01em] text-white/80 sm:text-[16px] sm:leading-[20px]">
            {{ t('home.contact.subtext') }}
          </p>
        </div>
        <AppButton variant="light" pill arrow @click="feedbackOpen = true">
          {{ t('home.contact.cta') }}
        </AppButton>
      </MotionReveal>
    </div>

    <FeedbackDialog v-model:open="feedbackOpen" />
  </section>
</template>
