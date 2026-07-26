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
      <!-- Stats pins while Products slides over it. Desktop only: a sticky box
           taller than the viewport pins its top and never scrolls its own
           bottom into view, so on phones the third stat was unreachable. -->
      <div class="z-0 lg:motion-safe:sticky lg:motion-safe:top-0">
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
