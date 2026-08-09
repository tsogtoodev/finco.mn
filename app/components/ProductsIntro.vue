<script setup lang="ts">
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const { t } = useI18n()

const TINT: Record<Audience, string> = {
  individual: 'bg-teal/5',
  business: 'bg-[rgba(102,80,255,0.05)]',
}
</script>

<template>
  <section
    class="relative isolate flex items-center justify-center overflow-hidden px-6 py-[24px]"
    :class="TINT[props.audience]"
  >
    <NuxtImg
      :src="`/images/products/intro-band-${props.audience}.png`"
      alt=""
      aria-hidden="true"
      loading="lazy"
      width="1920"
      height="159"
      densities="1x"
      class="pointer-events-none absolute inset-0 -z-10 size-full select-none"
    />

    <MotionReveal :y="16" class="w-full">
      <p
        class="mx-auto max-w-[1200px] text-center text-xl font-extralight leading-8 tracking-[0.01em] text-black/60 sm:text-[18px] sm:leading-[24px]"
      >
        {{ t(`productsPage.intro.${props.audience}`) }}
      </p>
    </MotionReveal>
  </section>
</template>
