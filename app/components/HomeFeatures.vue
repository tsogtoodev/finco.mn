<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')

const vp = computed(() => page.value?.valueProps)
const heading = computed(() => vp.value?.heading ?? t('home.features.heading'))
const headingAccent = computed(() => vp.value?.accent ?? t('home.features.headingAccent'))
const subtext = computed(() => vp.value?.subheading ?? t('home.features.subtext'))

const cards = computed(() => {
  const items =
    vp.value?.items ??
    (['fast', 'secure', 'smart'] as const).map((k) => ({
      title: t(`home.features.${k}.title`),
      body: t(`home.features.${k}.body`),
    }))
  return items.slice(0, 3)
})
</script>

<template>
  <section class="bg-[#fcfcff] py-[60px] lg:pb-[120px]">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-center gap-5 text-center">
        <h2 class="font-display text-3xl font-medium leading-tight text-[#141414] sm:text-4xl">
          {{ heading }}<span class="text-accent">{{ headingAccent }}</span>
        </h2>
        <p class="max-w-[702px] text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
          {{ subtext }}
        </p>
      </MotionReveal>

      <div class="mt-16 grid gap-6 lg:grid-cols-[453.33fr_722.67fr] lg:grid-rows-2">
        <MotionReveal :delay="0.1" class="lg:row-span-2">
          <article class="feature-card h-full min-h-[320px] lg:min-h-[533px]">
            <img src="/images/home/features-card-1.png" alt="" aria-hidden="true" class="feature-bg">
            <div aria-hidden="true" class="absolute inset-y-0 left-0 w-[83px] bg-gradient-to-r from-[#f6f6ff] to-transparent" />
            <div class="absolute left-[29px] top-[30px] flex w-[380px] max-w-[calc(100%-58px)] flex-col gap-3">
              <h3 class="font-display text-[22px] font-semibold leading-7 text-accent">
                {{ cards[0]?.title }}
              </h3>
              <p class="max-w-[354px] text-base font-light leading-6 tracking-[0.01em] text-black/60">
                {{ cards[0]?.body }}
              </p>
            </div>
          </article>
        </MotionReveal>

        <MotionReveal :delay="0.22">
          <article class="feature-card h-full min-h-[254px]">
            <img src="/images/home/features-card-2.png" alt="" aria-hidden="true" class="feature-bg">
            <div aria-hidden="true" class="absolute inset-y-0 right-0 w-[195px] bg-gradient-to-l from-[#f6f6ff] to-transparent" />
            <div class="absolute left-[37px] top-10 flex w-[556px] max-w-[calc(100%-74px)] flex-col gap-3">
              <h3 class="font-display text-[22px] font-semibold leading-7 text-accent">
                {{ cards[1]?.title }}
              </h3>
              <p class="text-base font-light leading-6 tracking-[0.01em] text-black/60">
                {{ cards[1]?.body }}
              </p>
            </div>
          </article>
        </MotionReveal>

        <MotionReveal :delay="0.34">
          <article class="feature-card h-full min-h-[254px]">
            <img src="/images/home/features-card-3.png" alt="" aria-hidden="true" class="feature-bg">
            <div aria-hidden="true" class="absolute inset-x-0 top-[119px] h-[135px] bg-gradient-to-b from-transparent to-white" />
            <div class="absolute bottom-[30px] right-10 flex w-[568px] max-w-[calc(100%-80px)] flex-col items-end gap-3 text-right">
              <h3 class="font-display text-[22px] font-semibold leading-7 text-accent">
                {{ cards[2]?.title }}
              </h3>
              <p class="text-base font-light leading-6 tracking-[0.01em] text-black/60">
                {{ cards[2]?.body }}
              </p>
            </div>
          </article>
        </MotionReveal>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #f6f6ff;
  border: 1px solid rgba(149, 49, 239, 0.05);
}

.feature-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}
</style>
