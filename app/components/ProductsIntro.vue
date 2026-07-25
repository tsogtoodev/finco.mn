<script setup lang="ts">
// Intro band below the hero (Figma 574:6912 individual / 574:7136 business).
// Brand-tinted full-bleed band with one centered 24px extra-light tagline; copy,
// tint and backdrop ribbon all differ per audience.
//
// Each backdrop is a huge brand-ribbon raster scaled/offset in Figma so only a
// faint arc sweeps through the strip — reproducing that transform from the source
// image doesn't match (the fill is cropped, not stretched), so each backdrop is
// its node's own 1920×159 export instead. They are OPAQUE and already carry the
// band tint; the `bg-*` below is just the pre-load colour.
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const { t } = useI18n()

// Figma tints, kept literal because neither is an exact design token:
// individual rgba(19,207,185,0.05) = teal/5, business rgba(102,80,255,0.05)
// (close to, but not, --color-accent-bright #6b4fff).
const TINT: Record<Audience, string> = {
  individual: 'bg-teal/5',
  business: 'bg-[rgba(102,80,255,0.05)]',
}
</script>

<template>
  <!-- min-h 159 = the design's band height; it lands exactly there for a single
       line and grows instead of clipping when the copy wraps. -->
  <section
    class="relative isolate flex min-h-[159px] items-center justify-center overflow-hidden px-6 py-10"
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

    <MotionReveal class="w-full">
      <p
        class="mx-auto max-w-[1200px] text-center text-xl font-extralight leading-8 tracking-[0.01em] text-black/60 sm:text-2xl sm:leading-[44px]"
      >
        {{ t(`productsPage.intro.${props.audience}`) }}
      </p>
    </MotionReveal>
  </section>
</template>
