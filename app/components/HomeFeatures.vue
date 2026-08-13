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
      <MotionReveal class="flex flex-col items-center gap-[8px] text-center">
        <h2 class="font-display text-3xl font-medium leading-tight text-[#141414] sm:text-[28px]">
          {{ heading }}<span class="text-accent">{{ headingAccent }}</span>
        </h2>
        <p class="max-w-[702px] text-lg font-extralight leading-7 tracking-[0.01em] text-black/60 sm:text-[18px]">
          {{ subtext }}
        </p>
      </MotionReveal>

      <div class="mt-16 grid gap-6 lg:grid-cols-3">
        <MotionReveal :delay="0.1">
          <TiltedCard
            :image-src="'/images/home/finco-features-1.png'"
            alt-text=""
            image-size="140px"
            :title="cards[0]?.title"
            :body="cards[0]?.body"
          />
        </MotionReveal>

        <MotionReveal :delay="0.22">
          <TiltedCard
            :image-src="'/images/home/finco-features-2.png'"
            alt-text=""
            image-size="120px"
            :title="cards[1]?.title"
            :body="cards[1]?.body"
          />
        </MotionReveal>

        <MotionReveal :delay="0.33">
          <TiltedCard
            :image-src="'/images/home/finco-features-3.png'"
            alt-text=""
            image-size="120px"
            :title="cards[2]?.title"
            :body="cards[2]?.body"
          />
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
