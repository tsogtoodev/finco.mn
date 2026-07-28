<script setup lang="ts">
// Contact — Бидэнтэй холбогдох. Light centered hero matching news/index.vue
// (Figma 663:16826 pattern), a ghost back button, contact details card (footer
// block 1:14377) + feedback form, then a static map.
//
// No `transparentHeader` here: that overlays the nav in white for a DARK hero,
// which this no longer is. The header stays solid, as on the news index.
const { t } = useI18n()
const localePath = useLocalePath()

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}

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
  <div class="bg-white">
    <!-- Hero — light and centered, mirroring news/index.vue: BlurText word-reveal
         on the title and subtitle, 1200px column, no breadcrumb. The back button
         sits above the centered block rather than in it, so the title stays
         optically centred on the column. -->
    <section class="px-6 lg:px-0 py-14 sm:py-20">
      <div class="mx-auto w-full max-w-[1200px]">
        <div class="hero-rise">
          <AppButton variant="ghost" class="h-10 w-fit" @click="goBack">
            <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
            {{ t('common.back') }}
          </AppButton>
        </div>

        <div class="mt-8 flex flex-col items-center gap-4 text-center">
          <BlurText
            :text="t('contactPage.hero.title')"
            as="h1"
            animate-by="words"
            :delay="60"
            class="justify-center font-display text-[32px] font-semibold tracking-[0.01em] text-black/80 sm:text-[40px]"
          />
          <BlurText
            :text="t('contactPage.hero.subtitle')"
            as="p"
            animate-by="words"
            :delay="20"
            :start-delay="0.1"
            class="justify-center text-base font-extralight tracking-[0.01em] text-black/50 sm:text-lg"
          />
        </div>
      </div>
    </section>

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
