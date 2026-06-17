<script setup lang="ts">
// Home hero — "BeepWallet" tab (Figma node 1:14121, full-bleed variant 1:3057).
//
// Full-bleed photo (hand holding a phone running the Beep app) with a dark
// bottom-left → transparent top-right gradient for legibility. Over it: the
// stylised Beep wordmark, headline, subtext and a lime CTA. A segmented tab bar
// (FincoBiz · BeepWallet · Зээлийн үйлчилгээ · Итгэлцэлийн үйлчилгээ) overlaps
// the bottom edge.
//
// The transparent overlay nav floats over this section — the page opts in via
// `definePageMeta({ transparentHeader: true })`.
//
// Assets live in public/ (not ~/assets): @nuxt/image's IPX dev transform 404s on
// bundled ~/assets images. hero-beep.jpg is the resized/optimised photo.
const { t } = useI18n()
const localePath = useLocalePath()

// Bottom tab bar. `key` is the product whose hero this swaps to. Only BeepWallet
// is wired (it IS this hero); FOLLOW-UP: clicking a tab should swap the hero
// photo + copy + active state. Built as the static active state for now — not
// faked — so the others are inert until the swap is implemented.
const tabs = [
  { key: 'fincoBiz', label: 'hero.tabs.fincoBiz' },
  { key: 'beepWallet', label: 'hero.tabs.beepWallet' },
  { key: 'loans', label: 'hero.tabs.loans' },
  { key: 'trust', label: 'hero.tabs.trust' },
] as const
const activeTab = 'beepWallet'
</script>

<template>
  <section
    class="relative isolate flex min-h-[560px] flex-col overflow-hidden bg-dark text-white sm:min-h-[680px] lg:min-h-[900px]"
  >
    <!-- Background photo (phone + Beep app), full bleed -->
    <NuxtImg
      src="/images/hero-beep.jpg"
      :alt="t('hero.headline')"
      width="1920"
      height="1241"
      fetchpriority="high"
      class="absolute inset-0 -z-20 size-full object-cover object-center"
    />
    <!-- Legibility gradient: dark bottom-left → transparent top-right (Figma 56.98°) -->
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10"
      style="background: linear-gradient(56.98deg, rgba(0, 0, 0, 0.71) 1.58%, rgba(0, 0, 0, 0) 96.45%);"
    />

    <!-- Body: vertically-centred copy block -->
    <div class="flex flex-1 items-center pb-28 pt-24 sm:pt-28">
      <div class="mx-auto w-full max-w-7xl px-4">
        <div class="max-w-[624px]">
          <NuxtImg
            src="/images/beep-wordmark.png"
            :alt="t('hero.wordmarkAlt')"
            width="108"
            height="40"
            class="hero-rise h-9 w-auto sm:h-10"
          />

          <h1
            class="hero-rise mt-6 font-display text-[2rem] font-semibold leading-[1.2] tracking-tight sm:text-[2.5rem] lg:text-[3rem] lg:leading-[4rem]"
            style="animation-delay: 80ms"
          >
            {{ t('hero.headline') }}
          </h1>

          <p
            class="hero-rise mt-6 max-w-[640px] text-base font-light leading-7 text-white/90 sm:text-xl sm:leading-8"
            style="animation-delay: 160ms"
          >
            {{ t('hero.subtextLine1') }}<br>{{ t('hero.subtextLine2') }}
          </p>

          <div class="hero-rise" style="animation-delay: 240ms">
            <NuxtLink
              :to="localePath('/products')"
              class="mt-10 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-lime px-4 text-sm font-medium text-dark shadow-2xs transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              {{ t('hero.cta') }}
              <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M3.33 8h9.34M9 4.33 12.67 8 9 11.67" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Segmented tab bar, overlapping the bottom edge -->
    <nav :aria-label="t('hero.tabs.beepWallet')" class="relative z-10">
      <ul class="mx-auto flex w-full max-w-7xl gap-6 overflow-x-auto px-4 pb-8 sm:gap-8 lg:gap-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li v-for="tab in tabs" :key="tab.key" class="w-40 shrink-0 lg:w-auto lg:min-w-0 lg:flex-1">
          <button
            type="button"
            :aria-current="tab.key === activeTab ? 'true' : undefined"
            class="flex w-full flex-col border-t-2 pb-6 pt-4 text-left text-sm transition-colors sm:text-base"
            :class="tab.key === activeTab
              ? 'border-teal font-medium text-white'
              : 'border-white/25 font-normal text-white/75 hover:text-white'"
          >
            <span class="truncate leading-5">{{ t(tab.label) }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </section>
</template>
