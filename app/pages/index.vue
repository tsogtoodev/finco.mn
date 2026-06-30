<script setup lang="ts">
// Home — Beep landing. Hero + the section components below it (Figma 1:11546).
// The hero is a full-bleed dark image carousel, so the nav floats over it with the
// transparent overlay treatment (white logo/links + scrim), solidifying on scroll.
definePageMeta({ transparentHeader: true })
const page = await usePageContent('home')

useSeoMeta({
  title: () => page.value?.hero?.headline ?? 'Finco Capital',
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <HomeHero />
    <HomeFeatures />
    <!-- Curtain reveal: HomeStats pins to the top while HomeProducts slides up
         over it on scroll (same mechanism as the footer curtain). The wrapper
         scopes the pin to just this pair; HomeProducts sits on a higher layer so
         it covers the pinned stats panel as it rises. Gated on motion-safe →
         reduced-motion users get the normal stacked sections. -->
    <div class="relative">
      <div class="z-0 motion-safe:sticky motion-safe:top-0">
        <HomeStats />
      </div>
      <div class="relative z-10">
        <HomeProducts />
      </div>
    </div>
    <HomeBeep />
    <HomeFincoBiz />
    <HomeNews />
    <HomeContactCta />
  </div>
</template>
