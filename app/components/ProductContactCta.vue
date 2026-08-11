<script setup lang="ts">
const { t } = useI18n()

const feedbackOpen = ref(false)

const splineEnabled = useSplineEnabled()
</script>

<template>
  <section class="relative isolate flex h-[350px] items-center overflow-hidden bg-[#080a12]">
    <div class="pointer-events-none absolute inset-y-0 left-0 w-1/3 [background:radial-gradient(60%_80%_at_0%_50%,rgba(33,71,132,0.35),transparent_70%)]" />
    <div
      class="absolute right-0 top-1/2 hidden h-[100%] w-[80%] max-w-[1040px] -translate-y-1/2 cursor-pointer lg:block"
      @click="feedbackOpen = true"
    >
      <SplineScene
        v-if="splineEnabled"
        scene="https://prod.spline.design/rAfqlL9pnx29yw5P/scene.splinecode?timestamp=20260810040000"
        no-drag
        preload
        defer-until-lcp
        :zoom="2"
        :max-pixel-ratio="0.75"
        :max-fps="30"
      />
      <NuxtImg
        v-else
        src="/images/home/contact-cards.png"
        alt=""
        sizes="820px"
        class="pointer-events-none absolute inset-0 top-1/2 size-full -translate-y-1/2 object-contain"
      />
    </div>

    <div
      class="pointer-events-none absolute inset-0 [background:linear-gradient(90deg,#080a12_0%,#080a12_38%,rgba(8,10,18,0.85)_50%,rgba(8,10,18,0)_72%)]"
    />

    <div class="pointer-events-none relative mx-auto w-full max-w-[1200px] px-6 lg:px-0">
      <MotionReveal class="pointer-events-auto flex max-w-[620px] flex-col items-start gap-8">
        <div class="flex flex-col gap-4">
          <h2 class="font-display text-3xl font-medium leading-tight text-white sm:text-[40px] sm:leading-[48px]">
            {{ t('home.contact.heading') }}
          </h2>
          <p class="max-w-[605px] text-base font-extralight leading-6 tracking-[0.01em] text-white/80 sm:text-[16px] sm:leading-[20px]">
            {{ t('home.contact.subtext') }}
          </p>
        </div>
        <AppButton variant="light" pill arrow @click="feedbackOpen = true">
          {{ t('home.contact.cta') }}
        </AppButton>
      </MotionReveal>
    </div>

    <FeedbackDialog v-model:open="feedbackOpen" />
  </section>
</template>
