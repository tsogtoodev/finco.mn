<script setup lang="ts">
// Features bento (Figma 1:14123): heading + subtext, then a bento grid —
// one tall card on the left, two stacked cards on the right.
const { t } = useI18n()

const cards = computed(() => [
  {
    icon: 'f:fast-time',
    title: t('home.features.fast.title'),
    body: t('home.features.fast.body'),
    image: '/images/home/feature-blob-1.png',
    class: 'lg:row-span-2 lg:min-h-[533px]',
  },
  {
    icon: 'f:usb',
    title: t('home.features.secure.title'),
    body: t('home.features.secure.body'),
    image: '/images/home/feature-blob-2.png',
    class: '',
  },
  {
    icon: 'f:cpu',
    title: t('home.features.smart.title'),
    body: t('home.features.smart.body'),
    image: '/images/home/feature-blob-3.png',
    class: '',
  },
])
</script>

<template>
  <section class="bg-[#fcfcff] py-[60px] lg:pb-[120px]">
    <div class="mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-center gap-5 text-center">
        <h2 class="font-display text-3xl font-medium leading-tight text-[#141414] sm:text-4xl">
          {{ t('home.features.heading') }}<span class="text-accent">{{ t('home.features.headingAccent') }}</span>
        </h2>
        <p class="max-w-[702px] text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
          {{ t('home.features.subtext') }}
        </p>
      </MotionReveal>

      <MotionReveal
        :delay="0.1"
        class="mt-16 grid gap-6 lg:grid-cols-[453.33fr_722.67fr] lg:grid-rows-2"
      >
        <FeatureCard
          v-for="(c, i) in cards"
          :key="i"
          :icon="c.icon"
          :title="c.title"
          :body="c.body"
          :image="c.image"
          :class="c.class"
        />
      </MotionReveal>
    </div>
  </section>
</template>
