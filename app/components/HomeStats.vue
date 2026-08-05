<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')

// Live wave on capable devices, the matching raster everywhere else.
const splineEnabled = useSplineEnabled()

const heading = computed(() => page.value?.statsHeading ?? t('home.stats.heading'))
const stats = computed(
  () =>
    page.value?.stats ?? [
      { value: 71000, label: t('home.stats.customers.label') },
      { value: 70, prefix: '₮', suffix: t('home.stats.funding.unit'), label: t('home.stats.funding.label') },
      { value: 26000, suffix: '+', label: t('home.stats.users.label') },
    ],
)

// Per-column gradient for the numbers (Figma). Positional, not editorial — the
// CMS `stats` entries carry copy only, so this can't live in the content layer.
const MASKS = ['mask-1', 'mask-2', 'mask-3']
</script>

<template>
  <section class="relative isolate overflow-hidden bg-[#0a0a1a] px-6 py-6 lg:py-32">
    <!-- Purple glow band (Figma 993:23263). Figma exports this as a shallow
         chevron path under `feGaussianBlur stdDeviation="95.55"`, and the export
         also carried `backdrop-filter: blur(95.55px)` on the <svg> itself.
         Measured, that was the single most expensive piece of CSS on the site: a
         95px blur is ~4x the cost of a 24px one, it ran over a 1894x601 region,
         the backdrop-filter forced a backdrop snapshot and re-blur on every
         composite, and all of it lived inside this section — which index.vue pins
         `sticky top-0`, so it re-composited for the entire products scroll while a
         live WebGL canvas rendered underneath.
         At that blur radius the chevron resolves to a diffuse elliptical glow, so
         a gradient IS the shape. Same picture, no filter, no snapshot. -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-1/2 hidden h-full w-full -translate-x-1/2 -translate-y-1/2 sm:block [background:radial-gradient(ellipse_58%_17%_at_50%_38%,rgba(74,57,208,0.30)_0%,rgba(74,57,208,0.14)_45%,transparent_78%)]"
    />
    <div class="pointer-events-none absolute left-1/2 top-2/3 hidden h-full min-h-[51vw] w-full -translate-x-1/2 -translate-y-[calc(50%+100px)] scale-120 sm:block">
      <!-- The wrapper already applies `scale-120`, so the canvas is CSS-upscaled
           regardless; 0.75x drops the drawing buffer to ~44% of its pixels for the
           same soft wave. Heaviest scene on the site for triangles (431k/frame). -->
      <SplineScene
        v-if="splineEnabled"
        scene="https://prod.spline.design/2MYVnmuRqu28b88y/scene.splinecode"
        no-drag
        no-hover
        :max-pixel-ratio="0.75"
        occluded-by="#home-products"
      />
      <NuxtImg
        v-else
        src="/images/home/stats-wave.png"
        alt=""
        aria-hidden="true"
        class="size-full object-cover"
      />
    </div>
    <NuxtImg
      src="/images/home/stats-wave.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full object-cover sm:hidden"
    />
    <!-- Edge softening. The masked `backdrop-blur-[4px]` pair that used to sit here
         cost two extra composited layers, each with its own backdrop snapshot, on
         every frame of the sticky scroll — to soften the edges of a scene the
         opaque gradients below already fade to the panel colour. Gradients alone. -->
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
          <p class="relative font-display text-5xl font-semibold text-white leading-tight mt-6" :class="MASKS[i % MASKS.length]">
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

<style scoped>
.mask-1,
.mask-2,
.mask-3 {
  position: relative;
}
.mask-1::after,
.mask-2::after,
.mask-3::after {
  content: '';
  position: absolute;
  inset: 0;
  mix-blend-mode: darken;
  pointer-events: none;
}
.mask-1::after {
  background: linear-gradient(90deg, #DBB9FF 0%, #6A92FF 100%);
}
.mask-2::after {
  background: linear-gradient(90deg, #998CFF 0%, #EAC2FF 100%);
}
.mask-3::after {
  background: linear-gradient(90deg, #E7E3FF 0%, #D628ED 100%);
}
</style>
