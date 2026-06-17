<script setup lang="ts">
// Intro band below the hero (Figma 1:13719 / 1:13942). Soft brand-tinted gradient
// surface with one centered extra-light tagline; copy + tint differ per audience.
import type { Audience } from '~/data/productListing'

const props = defineProps<{ audience: Audience }>()
const { t } = useI18n()
</script>

<template>
  <section
    class="px-6 py-16 sm:py-20"
    :class="props.audience === 'individual' ? 'bg-teal/5' : 'bg-accent/5'"
  >
    <MotionReveal>
      <p
        class="mx-auto max-w-[1030px] text-center text-xl font-extralight leading-relaxed tracking-[0.01em] text-black/60 sm:text-[32px] sm:leading-[44px]"
      >
        {{ t(`productsPage.intro.${props.audience}`) }}
      </p>
    </MotionReveal>
  </section>
</template>
