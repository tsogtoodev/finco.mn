<script setup lang="ts">
// Service-detail hero (Figma 1:14671). Mirrors ProductsHero: blurred dark
// lifestyle photo + diagonal scrim, a ghost "Буцах" back button top-left, and a
// centered headline + subtext. The breadcrumb was dropped per request, matching
// the products-listing and product-detail heroes.
// The global transparent nav overlays the top ~96px, so content gets top clearance.
const props = defineProps<{
  image?: string
  title?: string
  subtitle?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <section class="relative isolate flex min-h-[560px] flex-col overflow-hidden bg-dark text-white sm:min-h-[620px] lg:min-h-[660px]">
    <!-- blurred background photo + diagonal scrim (Figma: 251.2deg, 0.25 → 1.0 black) -->
    <HeroBackgroundImage
      v-if="props.image"
      :src="props.image"
      alt=""
      :width="1920"
      :height="660"
      wrapper-class="-z-10"
      img-class="size-full scale-110 object-cover blur-[5px]"
      preload
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(251.2deg, rgba(0, 0, 0, 0.25) 7%, rgba(0, 0, 0, 0.95) 96%)"
    />

    <!-- max-w-7xl + px-4 matches the header and the carousel/FAQ sections so the
         content aligns with the nav logo. pt clears the ~96px transparent nav. -->
    <div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-24 sm:pt-28">
      <!-- Back, ghost variant. Matches the products + product-detail heroes. -->
      <div class="hero-rise">
        <AppButton variant="ghost" class="h-10 w-fit" @click="goBack">
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          {{ t('common.back') }}
        </AppButton>
      </div>

      <!-- centered headline + subtext + CTA -->
      <div class="flex flex-1 flex-col items-center justify-center gap-8 pb-6 pt-10 text-center">
        <BlurText
          :text="props.title ?? ''"
          as="h1"
          animate-by="words"
          :delay="60"
          :start-delay="0.07"
          class="max-w-[860px] justify-center font-display text-3xl font-medium leading-[1.15] sm:text-4xl md:text-[48px] md:leading-[52px]"
        />
        <BlurText
          v-if="props.subtitle"
          :text="props.subtitle"
          as="p"
          animate-by="words"
          :delay="20"
          :start-delay="0.15"
          class="max-w-[640px] justify-center text-base font-extralight leading-7 text-white/90 sm:text-lg md:text-xl"
        />
      </div>
    </div>
  </section>
</template>
