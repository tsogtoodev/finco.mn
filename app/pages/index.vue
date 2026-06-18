<script setup lang="ts">
// Home — Beep landing. Hero + the section components below it (Figma 1:11546).
// The hero is now a light section with a rounded card carousel, so the nav stays
// solid (no transparent overlay).
const page = await usePageContent('home')

useSeoMeta({
  title: () => page.value?.hero?.headline ?? 'Finco Capital',
  description: () => page.value?.hero?.subheadline,
})
</script>

<template>
  <div>
    <HeroBeep />
    <HomeFeatures />
    <HomeStats />
    <HomeProducts />
    <HomeBeep />
    <HomeFincoBiz />
    <HomeNews />
    <HomeContactCta />
  </div>
</template>
