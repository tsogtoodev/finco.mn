<script setup lang="ts">
import type { BadgeBlock } from '~/composables/useAboutContent'
import glow from '~/assets/images/about-mission-glow.svg'

const props = defineProps<{ blocks: BadgeBlock[] }>()

const splineEnabled = useSplineEnabled()

const active = ref('0')

const tabs = computed(() =>
  props.blocks.map((b, i) => ({ value: String(i), label: b.badge })),
)

const current = computed(() => props.blocks[Number(active.value)] ?? props.blocks[0])

const TITLE_WORD_MS = 45
const TITLE_START = 0.05
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const bodyStart = computed(
  () => TITLE_START + (wordCount(current.value?.heading ?? '') * TITLE_WORD_MS) / 1000 + 0.06,
)
</script>

<template>
  <section class="relative isolate overflow-x-clip bg-[#080a12] pb-44 text-white sm:pb-80">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2"
      style="--glow-d: max(560px, 65.1vw); width: var(--glow-d); height: var(--glow-d); bottom: calc(var(--glow-d) * -0.6992)"
    >
      <div class="absolute inset-[-30%]">
        <img :src="glow" alt="" class="block size-full max-w-none">
      </div>
    </div>

    <div
      v-if="splineEnabled"
      aria-hidden="true"
      class="absolute bottom-0 left-1/2 -z-10 aspect-square -translate-x-1/2"
      style="width: max(560px, 65.1vw)"
    >
      <SplineScene
        scene="https://prod.spline.design/5QI6kS8kPdn7j7Y3/scene.splinecode?timestamp=20260812040000"
        preload
        no-drag
        defer-until-lcp
        :zoom="1"
        class="size-full"
      />
    </div>

    <div class="pointer-events-none relative mx-auto flex w-full max-w-[800px] flex-col items-center gap-10 px-6 sm:gap-12">
      <MotionReveal class="pointer-events-auto">
        <TabPills
          v-model="active"
          :tabs="tabs"
          class="backdrop-blur-[5px]"
          :style="{
            '--tabs-bar-bg': 'rgba(255, 255, 255, 0.1)',
            '--tabs-pill-bg': '#ffffff',
            '--tabs-text-muted': 'rgba(255, 255, 255, 0.8)',
            '--tabs-text-active': '#000000',
            '--tabs-text-hover': '#ffffff',
            '--tabs-radius': '9999px',
            '--tabs-pad': '6px',
            '--tabs-tab-h': '36px',
            '--tabs-tab-px': '28px',
            '--tabs-font': '16px',
            '--tabs-weight': '300',
            '--tabs-weight-active': '400',
          }"
        />
      </MotionReveal>

      <div v-if="current" class="flex w-full flex-col items-center gap-4 text-center">
        <BlurText
          :key="`h-${active}`"
          :text="current.heading"
          as="h2"
          animate-by="words"
          :delay="TITLE_WORD_MS"
          :start-delay="TITLE_START"
          class="justify-center font-display text-xl font-semibold leading-8 tracking-[0.24px] sm:text-[24px]"
        />
        <BlurText
          :key="`p-${active}`"
          :text="current.body"
          as="p"
          animate-by="words"
          :delay="18"
          :start-delay="bodyStart"
          class="justify-center text-[16px] font-extralight leading-[22px] tracking-[0.16px] text-white/60"
        />
      </div>
    </div>
  </section>
</template>
