<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{
  image?: string
  title?: string
  subtitle?: string
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
  <section class="relative isolate overflow-hidden bg-dark text-white">
    <HeroBackgroundImage
      v-if="props.image"
      :src="props.image"
      alt=""
      :width="1920"
      :height="660"
      wrapper-class="-z-10"
      img-class="size-full object-cover"
      preload
    />
    <!-- Diagonal scrim (Figma gradient fill: 250.94deg, 25% black → solid black) -->
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(250.94deg, rgba(0, 0, 0, 0.25) 7.446%, rgb(0, 0, 0) 95.599%)"
    />

    <!-- 1200px content column (max-w 1248 − 2×24 padding), matching the design's
         360px left edge at 1920. -->
    <div
      class="relative mx-auto w-full max-w-[1248px] px-6 lg:px-0 pb-10 pt-[100px] sm:pb-12 sm:pt-[112px] lg:pb-[49px] lg:pt-[100px]"
    >
      <!-- Back, ghost variant: no fill or border, so the padding box is invisible
           and the label sits on the column's left edge. -->
      <div class="hero-rise">
        <AppButton variant="ghost" class="h-10 w-fit" @click="goBack">
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          {{ t('common.back') }}
        </AppButton>
      </div>

      <!-- centred title + subtitle + stats + CTAs. The design tucks this block
           just 7px under the back button — they sit side by side rather than
           stacked, so only small screens need real breathing room. -->
      <div class="mt-10 flex flex-col items-center gap-8 text-center sm:mt-8 sm:gap-10 lg:mt-[7px]">
        <div class="flex w-full flex-col items-center gap-2">
          <BlurText
            :text="props.title ?? ''"
            as="h1"
            animate-by="words"
            :delay="60"
            :start-delay="0.07"
            class="justify-center font-display text-[28px] font-medium leading-[34px] sm:text-[32px] sm:leading-[38px]"
          />
          <BlurText
            v-if="props.subtitle"
            :text="props.subtitle"
            as="p"
            animate-by="words"
            :delay="20"
            :start-delay="0.13"
            class="justify-center text-base font-extralight leading-6 text-white sm:text-lg sm:leading-7 lg:text-[18px] lg:leading-[26px]"
          />
        </div>

        <!-- Stat boxes break 32px past the column on each side (design: a 1264
             row centred on the 1200 column), so the three 400px cards land
             exactly. Gated at xl, not lg: the break-out only fits once the
             viewport clears 1264px, otherwise the section clips the edges.
             blur-[40px] matches Figma's BACKGROUND_BLUR radius 40 1:1 — halving
             it (the usual layer-blur conversion) leaves the photo readable
             through the card, which is not what the design shows. -->
        <dl
          v-if="statItems.length"
          class="hero-rise-glass grid w-full grid-cols-1 gap-4 md:grid-cols-3 lg:gap-8"
          style="animation-delay: 0.24s"
        >
          <div
            v-for="s in statItems"
            :key="s.key"
            class="flex min-w-0 flex-col items-center justify-center gap-3 text-balance rounded-[12px] border border-white/20 bg-white/10 p-3 text-center backdrop-blur-[20px]"
          >
            <dt class="text-base font-extralight leading-6 text-white/80">{{ t(`loanTerms.${s.key}`) }}:</dt>
            <!-- 24px is the design's size against a 400px card; below lg the
                 cards are much narrower, so the value steps down to stay on one line -->
            <dd class="text-xl font-bold leading-6 text-white lg:text-2xl">{{ s.value }}</dd>
          </div>
        </dl>

        <div class="hero-rise-glass flex flex-col items-center gap-4 sm:flex-row sm:gap-6" style="animation-delay: 0.32s">
          <AppButton :to="props.locationTo || '/branches'" variant="glass" class="h-10">
            {{ t('productHero.location') }}
          </AppButton>
          <AppButton :to="props.applyTo || '/contact'" variant="light" arrow class="h-10 border border-input">
            {{ t('productHero.apply') }}
          </AppButton>
        </div>
      </div>
    </div>
  </section>
</template>
