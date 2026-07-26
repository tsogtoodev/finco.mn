<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')

const heading = computed(() => page.value?.statsHeading ?? t('home.stats.heading'))
const stats = computed(
  () =>
    page.value?.stats ?? [
      { value: 71000, label: t('home.stats.customers.label') },
      { value: 70, prefix: '₮', suffix: t('home.stats.funding.unit'), label: t('home.stats.funding.label') },
      { value: 26000, suffix: '+', label: t('home.stats.users.label') },
    ],
)
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#0a0a1a] px-6 py-6 lg:py-32">
    <div class="pointer-events-none absolute left-1/2 top-2/3 hidden h-full min-h-[51vw] w-full -translate-x-1/2 -translate-y-[calc(50%+100px)] scale-120 sm:block">
      <ClientOnly>
        <SplineScene scene="https://prod.spline.design/2MYVnmuRqu28b88y/scene.splinecode" no-drag />
        <template #fallback>
          <NuxtImg
            src="/images/home/stats-wave.png"
            alt=""
            aria-hidden="true"
            class="size-full object-cover"
          />
        </template>
      </ClientOnly>
    </div>
    <NuxtImg
      src="/images/home/stats-wave.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full object-cover sm:hidden"
    />
    <div class="pointer-events-none absolute inset-y-0 left-0 w-[28%] backdrop-blur-[4px] [mask-image:linear-gradient(to_right,black,transparent)] [-webkit-mask-image:linear-gradient(to_right,black,transparent)]" />
    <div class="pointer-events-none absolute inset-y-0 right-0 w-[28%] backdrop-blur-[4px] [mask-image:linear-gradient(to_left,black,transparent)] [-webkit-mask-image:linear-gradient(to_left,black,transparent)]" />
    <div class="pointer-events-none absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-[#0a0a1a] to-transparent" />
    <div class="pointer-events-none absolute inset-y-0 right-0 w-[28%] bg-gradient-to-l from-[#0a0a1a] to-transparent" />

    <div class="relative mx-auto flex w-full max-w-[1200px] flex-col items-center">
      <MotionReveal
        as="h2"
        class="max-w-[1015px] text-center font-display text-[24px] font-semibold leading-tight tracking-wide text-white"
      >
        {{ heading }}
      </MotionReveal>

      <div class="mt-24 grid w-full grid-cols-1 gap-12 sm:mt-80 sm:grid-cols-3 sm:gap-6">
        <div
          v-for="(s, i) in stats"
          :key="i"
          class="relative flex flex-col items-center gap-2 text-center"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute left-1/2 top-0 hidden w-px -translate-x-1/2 -translate-y-[134px] sm:block [background:linear-gradient(to_bottom,#3b06cd_0%,#cd06ab_15.87%,#600a51_31.73%,rgba(118,70,108,0)_100%)]"
            :class="i === 1 ? 'h-[156px]' : 'h-[126px]'"
            style="transform: scaleY(-1)"
          />
          <p class="relative font-display text-5xl font-semibold text-white leading-tight mt-6">
            <span v-if="s.prefix">{{ s.prefix }}</span><StatCounter :value="s.value" /><span
              v-if="s.suffix"
              :class="s.prefix ? 'text-2xl' : ''"
            >{{ s.suffix }}</span>
          </p>
          <p class="relative text-[15px] font-extralight tracking-wide text-white/80">{{ s.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
