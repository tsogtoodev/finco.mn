<script setup lang="ts">
// Contact — Бидэнтэй холбогдох. Composed from the existing design system: dark
// PageHero (1:13610 breadcrumb + back + centered title), contact details card
// (footer block 1:14377) + net-new feedback form, then a static map. The dark
// hero opts into the transparent overlay nav.
definePageMeta({ transparentHeader: true })

const { t } = useI18n()

// Finco Capital head office — Soyol Amralt, Sukhbaatar District, Ulaanbaatar.
// Mirrors the `hq` branch entry (content/branches/*/hq.yml); MapEmbed needs the
// base raster and pin as well as the coords, or it renders an empty gradient.
const office = {
  lat: 47.918017,
  lng: 106.917565,
  mapImage: '/images/branches/map-base.jpg',
  pin: { x: 0.5, y: 0.54 },
}

useSeoMeta({
  title: () => t('contactPage.hero.title'),
  description: () => t('contactPage.hero.subtitle'),
})
</script>

<template>
  <div>
    <PageHero
      dark
      back
      centered
      :title="t('contactPage.hero.title')"
      :subtitle="t('contactPage.hero.subtitle')"
      :breadcrumb="[
        { label: t('common.homeBreadcrumb'), to: '/' },
        { label: t('contactPage.hero.breadcrumb') },
      ]"
    />

    <section class="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <div class="grid items-start gap-8 lg:grid-cols-2">
        <MotionReveal>
          <ContactInfo />
        </MotionReveal>
        <MotionReveal :delay="0.1">
          <ContactForm />
        </MotionReveal>
      </div>

      <MotionReveal :delay="0.15" class="mt-8">
        <MapEmbed
          class="h-64 sm:h-80 lg:h-[420px]"
          :map-image="office.mapImage"
          :pin="office.pin"
          :lat="office.lat"
          :lng="office.lng"
          :aria-label="t('contactPage.mapLabel')"
        />
      </MotionReveal>
    </section>
  </div>
</template>
