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
    <AboutHero :headline="c.hero.headline" :intro="c.hero.intro" :photo="c.hero.photo" />
    <AboutMissionV3 :blocks="c.mission.blocks" />
    <AboutValues
      :heading-lead="c.values.headingLead"
      :heading-accent="c.values.headingAccent"
      :subheading="c.values.subheading"
      :items="c.values.items"
    />
    <AboutTimeline
      :heading-lead="c.history.headingLead"
      :heading-accent="c.history.headingAccent"
      :subheading="c.history.subheading"
      :milestones="c.history.milestones"
    />
    <AboutCeoMessage :ceo="c.ceo" />
    <AboutBoard :board="c.board" />
    <AboutOrgChart :org="c.org" />
  </div>
</template>
