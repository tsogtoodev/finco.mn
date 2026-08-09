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
    <div class="relative">
      <div class="z-0 overflow-hidden bg-[#0a0a1a] lg:motion-safe:sticky lg:motion-safe:top-0">
        <HomeStats />
      </div>
      <div class="relative z-10">
        <HomeProducts />
      </div>
    </div>
    <HomeBeepV2 />
    <HomeFincoBiz />
    <HomeNews />
    <HomeContactCta />
  </div>
</template>
