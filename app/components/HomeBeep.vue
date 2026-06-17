<script setup lang="ts">
// Beep showcase (Figma 1:14222): dark-green radial card, lifestyle photo, lime
// Beep wordmark, heading, a feature-pill cluster and a "+" expand revealing the
// app-download / learn-more drawer.
const { t } = useI18n()
const localePath = useLocalePath()

const expanded = ref(false)

const pills = computed(() => [
  { key: 'purchase', icon: 'lucide:shopping-cart', color: 'text-teal' },
  { key: 'loan', icon: 'lucide:hand-coins', color: 'text-lime' },
  { key: 'loyalty', icon: 'lucide:heart', color: 'text-pink-400' },
  { key: 'luck', icon: 'lucide:gauge', color: 'text-teal' },
  { key: 'rewards', icon: 'lucide:star', color: 'text-amber-400' },
  { key: 'split', icon: 'lucide:split', color: 'text-lime' },
  { key: 'finance', icon: 'lucide:calculator', color: 'text-sky-300' },
  { key: 'energy', icon: 'lucide:zap', color: 'text-lime' },
  { key: 'card', icon: 'lucide:credit-card', color: 'text-lime' },
] as const)
</script>

<template>
  <section class="bg-white px-6 py-10">
    <MotionReveal
      class="relative mx-auto min-h-[560px] w-full max-w-[1440px] overflow-hidden rounded-[40px] lg:h-[704px]"
      :style="{ background: 'radial-gradient(120% 130% at 88% 0%, #0f2c23 0%, #071612 50%, #040b09 75%, #000 100%)' }"
    >
      <!-- Halftone dots -->
      <NuxtImg
        src="/images/home/beep-dots.png"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute bottom-6 left-0 w-[46%] max-w-[560px] opacity-90"
      />
      <!-- Lifestyle photo -->
      <NuxtImg
        src="/images/home/beep-lifestyle.png"
        alt=""
        aria-hidden="true"
        sizes="700px"
        class="pointer-events-none absolute -right-6 bottom-0 hidden h-[105%] w-auto max-w-none object-contain md:block"
      />

      <!-- Expand toggle -->
      <button
        type="button"
        :aria-expanded="expanded"
        :aria-label="t('home.beep.toggle')"
        class="absolute right-7 top-7 z-30 flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
        @click="expanded = !expanded"
      >
        <Icon :name="expanded ? 'lucide:minus' : 'lucide:plus'" class="size-6" />
      </button>

      <div class="relative z-10 flex h-full flex-col p-8 lg:p-11">
        <!-- Heading -->
        <div class="max-w-[300px]">
          <h2 class="font-display text-xl font-semibold leading-8 text-white">{{ t('home.beep.heading') }}</h2>
          <p class="mt-2 text-base font-light leading-6 text-white/60">{{ t('home.beep.subtext') }}</p>
        </div>

        <!-- Pills -->
        <ul class="mt-8 flex max-w-[680px] flex-wrap gap-3 lg:absolute lg:left-[34%] lg:top-24">
          <li
            v-for="p in pills"
            :key="p.key"
            class="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.07] px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm"
          >
            <Icon :name="p.icon" class="size-4" :class="p.color" />
            {{ t(`home.beep.pills.${p.key}`) }}
          </li>
        </ul>

        <!-- Wordmark -->
        <img
          src="/images/home/beep-wordmark-lime.svg"
          :alt="t('hero.wordmarkAlt')"
          class="mt-auto w-[180px] lg:absolute lg:bottom-24 lg:left-11"
        >

        <!-- Expand drawer -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3"
          leave-active-class="transition duration-200 ease-in"
          leave-to-class="opacity-0 translate-y-3"
        >
          <div
            v-if="expanded"
            class="relative z-20 mt-8 flex flex-col gap-6 rounded-3xl bg-white/5 p-6 backdrop-blur-md lg:absolute lg:inset-x-11 lg:bottom-8 lg:mt-0 lg:flex-row lg:items-center lg:gap-16 lg:p-8"
          >
            <p class="flex-1 text-lg font-light leading-relaxed text-white/80">
              <span class="font-bold text-white">{{ t('home.beep.expandLead') }}</span>
              {{ ' ' }}{{ t('home.beep.expandRest') }}
            </p>
            <div class="flex shrink-0 flex-wrap gap-4">
              <span class="inline-flex items-center gap-2.5 rounded-full border border-lime bg-white/15 px-4 py-2 text-base font-medium text-white">
                <Icon name="lucide:smartphone" class="size-4" />
                {{ t('home.beep.appDownload') }}
              </span>
              <NuxtLink
                :to="localePath('/products')"
                class="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-base font-medium text-white transition hover:bg-white/25"
              >
                {{ t('common.learnMore') }}
                <Icon name="lucide:arrow-right" class="size-4" />
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </div>
    </MotionReveal>
  </section>
</template>
