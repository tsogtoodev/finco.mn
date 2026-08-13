<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}

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
    <section class="px-6 lg:px-0 py-14">
      <div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-0">
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

    <section class="mx-auto px-4 py-16 sm:py-[80px] bg-[#fbfbfb]">
      <div class="mx-auto w-full max-w-7xl px-4">
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
      </div>
    </section>
  </div>
</template>
