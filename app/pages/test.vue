<script setup lang="ts">
// About Us — Бидний тухай (Figma 1:12179). Full-bleed dark hero, so the page
// opts into the transparent overlay nav. Footer comes from the default layout.
definePageMeta({ transparentHeader: true })

const { t } = useI18n()
const c = await useAboutContent()

useSeoMeta({
  title: () => (c.value ? `${c.value.hero.headline} · ${t('nav.about')}` : t('nav.about')),
  description: () => c.value?.hero.intro,
})
</script>

<template>
  <div v-if="c">
    <HomeFeatures />
  </div>
</template>
