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
    <HomeStats />
    <HomeProducts />
    <HomeBeep />
    <HomeFincoBiz />
    <HomeNews />
    <HomeContactCta />
  </div>
</template>
