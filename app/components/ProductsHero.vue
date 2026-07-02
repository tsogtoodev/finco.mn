<script setup lang="ts">
// Products-listing hero (Figma 1:13610 / 1:13834). Dark lifestyle photo + scrim,
// breadcrumb + "Буцах" back button top-left, centered headline, and the audience
// toggle pinned below it. The global transparent nav overlays the top 96px, so the
// content gets top clearance. Photo differs per audience; copy is shared.
import { heroPhoto, type Audience } from '~/data/productListing'

const props = defineProps<{ audience: Audience }>()
const { t } = useI18n()
const localePath = useLocalePath()

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <section class="relative isolate flex min-h-[560px] flex-col overflow-hidden bg-dark text-white sm:min-h-[620px]">
    <!-- background photo + diagonal scrim (Figma: 250.94deg, 0.25 → 0.75 black) -->
    <NuxtImg
      :src="heroPhoto[props.audience]"
      alt=""
      width="1920"
      height="660"
      class="absolute inset-0 -z-10 size-full object-cover"
      preload
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(250.94deg, rgba(0, 0, 0, 0.3) 7%, rgba(0, 0, 0, 0.78) 96%)"
    />

    <!-- max-w-7xl + px-4 matches the header and page sections so the breadcrumb aligns with the nav logo -->
    <div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-14 pt-24 sm:pt-28">
      <!-- breadcrumb + back -->
      <div class="hero-rise flex flex-col gap-5">
        <nav aria-label="Breadcrumb">
          <ol class="flex items-center gap-2.5 text-sm">
            <li>
              <NuxtLink :to="localePath('/')" class="font-extralight text-white/60 transition-colors hover:text-white">
                {{ t('productsPage.breadcrumbHome') }}
              </NuxtLink>
            </li>
            <li aria-hidden="true" class="font-extralight text-white">/</li>
            <li class="font-light text-white" aria-current="page">{{ t('productsPage.breadcrumbCurrent') }}</li>
          </ol>
        </nav>

        <button
          type="button"
          class="inline-flex h-10 w-fit items-center gap-2 rounded-[var(--radius)] bg-secondary px-4 text-sm font-medium text-[#171717] transition duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-white active:scale-[0.92] active:blur-[1.5px] motion-reduce:transition-none cursor-pointer"
          @click="goBack"
        >
          <Icon name="lucide:arrow-left" class="size-4" />
          {{ t('common.back') }}
        </button>
      </div>

      <!-- centered headline + audience toggle -->
      <div class="flex flex-1 flex-col items-center justify-center gap-10 pb-6 pt-10 text-center sm:gap-12">
        <BlurText
          :text="t('productsPage.headline')"
          as="h1"
          animate-by="words"
          :delay="120"
          :start-delay="0.1"
          class="max-w-[700px] justify-center font-display text-3xl font-bold leading-[1.2] sm:text-4xl md:text-[40px] md:leading-[48px]"
        />
        <div class="hero-rise" style="animation-delay: 0.24s">
          <AudienceToggle :audience="props.audience" />
        </div>
      </div>
    </div>
  </section>
</template>
