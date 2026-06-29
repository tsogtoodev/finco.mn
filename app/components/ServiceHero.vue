<script setup lang="ts">
// Service-detail hero (Figma 1:14671). Mirrors ProductsHero: blurred dark
// lifestyle photo + diagonal scrim, breadcrumb + "Буцах" back button top-left,
// centered headline + subtext, and a light CTA pill (reuses AppButton `light`).
// The global transparent nav overlays the top ~96px, so content gets top clearance.
const props = defineProps<{
  image?: string
  title?: string
  subtitle?: string
  breadcrumbCurrent?: string
  cta?: { label: string; to: string }
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
    <NuxtImg
      v-if="props.image"
      :src="props.image"
      alt=""
      width="1920"
      height="660"
      class="absolute inset-0 -z-10 size-full scale-110 object-cover blur-[5px]"
      preload
    />
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(251.2deg, rgba(0, 0, 0, 0.25) 7%, rgba(0, 0, 0, 0.95) 96%)"
    />

    <!-- max-w-7xl + px-4 matches the header and the carousel/FAQ sections so the breadcrumb
         aligns with the nav logo and page content. pt clears the ~96px transparent nav. -->
    <div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-24 sm:pt-28">
      <!-- breadcrumb + back -->
      <div class="hero-rise flex flex-col gap-[23px]">
        <nav aria-label="Breadcrumb">
          <ol class="flex items-center gap-2.5">
            <li>
              <NuxtLink :to="localePath('/')" class="text-sm font-extralight text-white/60 transition-colors hover:text-white">
                {{ t('common.homeBreadcrumb') }}
              </NuxtLink>
            </li>
            <li aria-hidden="true" class="text-sm font-extralight text-white">/</li>
            <li class="text-base font-medium text-white" aria-current="page">
              {{ props.breadcrumbCurrent || props.title }}
            </li>
          </ol>
        </nav>

        <button
          type="button"
          class="inline-flex h-10 w-fit items-center gap-2 rounded-[var(--radius)] border border-white/20 px-4 text-sm font-medium text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-white/10 active:scale-[0.92] active:blur-[1.5px] motion-reduce:transition-none cursor-pointer"
          @click="goBack"
        >
          <Icon name="lucide:arrow-left" class="size-4" />
          {{ t('common.back') }}
        </button>
      </div>

      <!-- centered headline + subtext + CTA -->
      <div class="flex flex-1 flex-col items-center justify-center gap-8 pb-6 pt-10 text-center">
        <h1
          class="hero-rise max-w-[860px] font-display text-3xl font-medium leading-[1.15] sm:text-4xl md:text-[48px] md:leading-[52px]"
          style="animation-delay: 0.12s"
        >
          {{ props.title }}
        </h1>
        <p
          v-if="props.subtitle"
          class="hero-rise max-w-[640px] text-base font-extralight leading-7 text-white/90 sm:text-lg md:text-xl"
          style="animation-delay: 0.24s"
        >
          {{ props.subtitle }}
        </p>
        <div v-if="props.cta" class="hero-rise pt-2" style="animation-delay: 0.36s">
          <AppButton :to="props.cta.to" variant="light" size="lg" arrow>
            {{ props.cta.label }}
          </AppButton>
        </div>
      </div>
    </div>
  </section>
</template>
