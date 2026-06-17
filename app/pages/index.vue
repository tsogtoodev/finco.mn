<script setup lang="ts">
// Home — Beep landing. Hero + the section components below it (Figma 1:14110).
// The Beep hero is a dark image hero, so opt into the transparent overlay nav.
definePageMeta({ transparentHeader: true })

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
