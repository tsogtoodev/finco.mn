<script setup lang="ts">
import type { Collections } from '@nuxt/content'

// Product-detail hero (Figma 1:13321). Mirrors ServiceHero's blurred dark photo +
// diagonal scrim, breadcrumb + "Буцах" back button top-left, but the centred block
// adds an audience eyebrow, three translucent stat boxes (loan terms) and a dual
// CTA row ("Хаяг байршил харах" outline + "Хүсэлт илгээх" light).
const props = defineProps<{
  image?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  breadcrumb?: { label: string; to?: string }[]
  terms?: NonNullable<Collections['products']['loanTerms']>
  locationTo?: string
  applyTo?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const statItems = computed(() =>
  props.terms
    ? ([
        { key: 'amount', value: props.terms.amount },
        { key: 'rate', value: props.terms.rate },
        { key: 'period', value: props.terms.period },
      ] as const).filter((s) => s.value)
    : [],
)

function goBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo(localePath('/'))
}
</script>

<template>
  <section class="relative isolate flex min-h-[620px] flex-col overflow-hidden bg-dark text-white lg:min-h-[660px]">
    <!-- blurred background photo + diagonal scrim (Figma: 250.94deg, 0.25 → 1.0 black) -->
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
      style="background: linear-gradient(250.94deg, rgba(0, 0, 0, 0.25) 7.45%, rgba(0, 0, 0, 1) 95.6%)"
    />

    <!-- max-w-7xl + px-4 aligns the breadcrumb with the nav logo; pt clears the ~96px transparent nav -->
    <div class="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-24 sm:pt-28">
      <!-- breadcrumb + back -->
      <div class="hero-rise flex flex-col gap-[23px]">
        <nav v-if="props.breadcrumb?.length" aria-label="Breadcrumb">
          <ol class="flex items-center gap-2.5">
            <template v-for="(c, i) in props.breadcrumb" :key="i">
              <li>
                <NuxtLink
                  v-if="c.to"
                  :to="localePath(c.to)"
                  class="text-sm font-extralight text-white/60 transition-colors hover:text-white"
                >
                  {{ c.label }}
                </NuxtLink>
                <span v-else class="text-base font-medium text-white" aria-current="page">{{ c.label }}</span>
              </li>
              <li v-if="i < props.breadcrumb.length - 1" aria-hidden="true" class="text-sm font-extralight text-white/60">/</li>
            </template>
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

      <!-- centred eyebrow + title + subtitle + stats + CTAs -->
      <div class="flex flex-1 flex-col items-center justify-center gap-10 pb-4 pt-10 text-center">
        <div class="flex flex-col items-center gap-3">
          <BlurText
            v-if="props.eyebrow"
            :text="props.eyebrow"
            as="p"
            animate-by="words"
            :delay="80"
            class="justify-center font-display text-xl font-semibold text-teal"
          />
          <BlurText
            :text="props.title ?? ''"
            as="h1"
            animate-by="words"
            :delay="120"
            :start-delay="0.12"
            class="max-w-[900px] justify-center font-display text-3xl font-medium leading-[1.05] sm:text-4xl md:text-[48px] md:leading-[48px]"
          />
          <BlurText
            v-if="props.subtitle"
            :text="props.subtitle"
            as="p"
            animate-by="words"
            :delay="35"
            :start-delay="0.24"
            class="max-w-[720px] justify-center text-base font-extralight leading-7 text-white/90 sm:text-lg md:text-xl"
          />
        </div>

        <dl
          v-if="statItems.length"
          class="hero-rise grid w-full max-w-[1264px] grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8"
          style="animation-delay: 0.24s"
        >
          <div
            v-for="s in statItems"
            :key="s.key"
            class="flex flex-col items-center justify-center gap-3 rounded-[12px] bg-white/10 p-3"
          >
            <dt class="text-lg font-extralight text-white/80 sm:text-xl">{{ t(`loanTerms.${s.key}`) }}:</dt>
            <dd class="text-2xl font-bold text-white">{{ s.value }}</dd>
          </div>
        </dl>

        <div class="hero-rise flex flex-col items-center gap-4 sm:flex-row sm:gap-10" style="animation-delay: 0.32s">
          <NuxtLink
            :to="localePath(props.locationTo || '/branches')"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-white/20 bg-white/10 px-6 text-base font-medium text-white transition-colors duration-150 hover:bg-white/20"
          >
            {{ t('productHero.location') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath(props.applyTo || '/contact')"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#e6e6e6] bg-white px-6 text-base font-medium text-[#28303f] shadow-2xs transition-colors duration-150 hover:bg-white/90"
          >
            {{ t('productHero.apply') }}
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
