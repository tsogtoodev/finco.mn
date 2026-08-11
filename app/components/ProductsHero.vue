<script setup lang="ts">
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience; photo?: string; headline?: string }>()
const { t } = useI18n()
const localePath = useLocalePath()

const photoSrc = computed(() => props.photo ?? `/images/products/hero-${props.audience}.jpg`)

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <section class="relative isolate overflow-hidden bg-dark text-white">
    <HeroBackgroundImage
      :src="photoSrc"
      alt=""
      :width="1920"
      :height="660"
      wrapper-class="-z-10"
      img-class="size-full scale-[1.16] object-cover"
      preload
    />
    <HeroBackgroundImage
      :src="photoSrc"
      alt=""
      aria-hidden="true"
      :width="1920"
      :height="660"
      wrapper-class="-z-10"
      img-class="size-full scale-[1.22] object-cover blur-[20px] sm:blur-[30px] lg:blur-[40px]"
      style="
        -webkit-mask-image: linear-gradient(to right, #000 0%, #000 12%, transparent 52%);
        mask-image: linear-gradient(to right, #000 0%, #000 12%, transparent 52%);
      "
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(250.94deg, rgba(0, 0, 0, 0.25) 7.446%, rgba(0, 0, 0, 0.75) 95.599%)"
    />

    <div
      class="relative mx-auto w-full max-w-[1248px] px-6 lg:px-0 pb-10 pt-[100px] sm:pb-12 sm:pt-[112px] lg:pb-[54px] lg:pt-[100px]"
    >
      <div class="hero-rise">
        <AppButton variant="ghost" class="h-10 w-fit" @click="goBack">
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          {{ t('common.back') }}
        </AppButton>
      </div>

      <div class="mt-6 flex flex-col items-center gap-7 text-center sm:gap-8">
        <BlurText
          :text="props.headline ?? t('productsPage.headline')"
          as="h1"
          animate-by="words"
          :delay="60"
          :start-delay="0.06"
          class="max-w-[880px] justify-center font-display text-[26px] font-bold leading-[34px] sm:text-[28px] sm:leading-[40px] lg:text-[32px] lg:leading-[48px]"
        />
        <div class="hero-rise" style="animation-delay: 0.24s">
          <AudienceToggle :audience="props.audience" />
        </div>
      </div>
    </div>
  </section>
</template>
