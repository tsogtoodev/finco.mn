<script setup lang="ts">
// Products-listing hero — Figma 574:6802 (2026-07 redesign; supersedes 1:13610).
// Progressively-blurred lifestyle photo under a diagonal scrim, breadcrumb +
// outlined "Буцах" button pinned to the left of the 1200px column, then a
// centred 32/48 headline with the audience toggle beneath it.
//
// Only the 60px nav overlays this section — SiteHeader's transparent variant
// pulls it over the page with `-mb-[60px]`, while the announcement bar keeps its
// own flow height above us. So the top padding is 60px of nav clearance plus the
// design's own breathing room, and it stays correct when the bar is dismissed.
// Photo + headline come from the `pages` collection via the parent; i18n keeps
// the chrome labels.
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
      <!-- breadcrumb + back -->
      <div class="hero-rise flex flex-col items-start gap-4 sm:gap-5 lg:gap-[23px]">
        <nav aria-label="Breadcrumb">
          <ol class="flex flex-wrap items-center gap-x-2.5 gap-y-1 leading-7">
            <li>
              <NuxtLink
                :to="localePath('/')"
                class="text-sm font-extralight text-white/60 transition-colors hover:text-white"
              >
                {{ t('productsPage.breadcrumbHome') }}
              </NuxtLink>
            </li>
            <li aria-hidden="true" class="text-sm font-extralight text-white">/</li>
            <li class="text-base font-light text-white" aria-current="page">
              {{ t('productsPage.breadcrumbCurrent') }}
            </li>
          </ol>
        </nav>

        <button
          type="button"
          class="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-white/20 px-4 text-sm font-medium text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-white/10 active:scale-[0.92] active:blur-[1.5px] motion-reduce:transition-none"
          @click="goBack"
        >
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          {{ t('common.back') }}
        </button>
      </div>

      <!-- centred headline + audience toggle -->
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
