<script setup lang="ts">
import type { Milestone } from '~/composables/useAboutContent'

const props = defineProps<{
  headingLead: string
  headingAccent: string
  subheading: string
  milestones: Milestone[]
}>()

const ROW_TINTS = ['#faf9fe', '#f7f5fd', '#f4f1fc', '#f1edfb', '#ebe7f9', '#e5e1f7'] as const
const DOT_COLORS = ['#dddbf7', '#ceccf4', '#c1bef1', '#b5b1ee', '#aaa6ec', '#a19cea'] as const
const rowTint = (i: number) => ROW_TINTS[Math.min(i, ROW_TINTS.length - 1)]
const dotColor = (i: number) => DOT_COLORS[Math.min(i, DOT_COLORS.length - 1)]

const blockEl = ref<HTMLElement | null>(null)

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t))

const SCRUB_RATE = 5

let current = 0
let target = 0
let rafId = 0
let lastT = 0

function rowNodes(): HTMLElement[] {
  return blockEl.value ? (Array.from(blockEl.value.children) as HTMLElement[]) : []
}

function computeTarget(): number {
  const el = blockEl.value
  if (!el) return 0
  const r = el.getBoundingClientRect()
  const startY = r.top + r.height * 0.25
  const endY = r.top + r.height * 1.125
  return Math.min(1, Math.max(0, (window.innerHeight - startY) / (endY - startY)))
}

function apply(p: number) {
  const eased = easeInOutQuad(p)
  const nodes = rowNodes()
  const base = nodes[0]?.offsetTop ?? 0
  for (let i = 1; i < nodes.length; i++) {
    const distance = nodes[i]!.offsetTop - base
    nodes[i]!.style.transform = `translate3d(0, ${(-distance * (1 - eased)).toFixed(2)}px, 0)`
  }
}

function tick(t: number) {
  const dt = Math.min((t - lastT) / 1000, 0.1)
  lastT = t
  current += (target - current) * (1 - Math.exp(-SCRUB_RATE * dt))
  if (Math.abs(target - current) < 0.001) {
    current = target
    apply(current)
    rafId = 0
    return
  }
  apply(current)
  rafId = requestAnimationFrame(tick)
}

function sync() {
  target = computeTarget()
  if (!rafId) {
    lastT = performance.now()
    rafId = requestAnimationFrame(tick)
  }
}

const { start } = useScrollSync(sync)

function jumpToScrollPosition() {
  current = target = computeTarget()
  apply(current)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  jumpToScrollPosition()
  start()
  watch(() => props.milestones, () => nextTick(jumpToScrollPosition), { flush: 'post' })
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <section class="relative overflow-hidden bg-[#fbfbfb]">
    <div class="mx-auto max-w-[1200px] px-4 pt-12 sm:pt-[120px]">
      <MotionReveal class="flex max-w-5xl flex-col gap-[8px]">
        <h2 class="font-display text-3xl font-normal text-[#141414] sm:text-[28px] leading-normal">
          {{ headingLead }}<span class="text-[#4c41d8]">{{ headingAccent }}</span>
        </h2>
        <p class="max-w-[850px] text-lg font-extralight leading-[24px] text-[rgba(0,0,0,0.6)] sm:text-[18px]">
          {{ subheading }}
        </p>
      </MotionReveal>
    </div>

    <div
      ref="blockEl"
      class="relative mt-10 overflow-hidden sm:mt-16"
      :style="{ background: ROW_TINTS[ROW_TINTS.length - 1] }"
    >
      <div
        v-for="(m, i) in milestones"
        :key="i"
        class="relative w-full will-change-transform"
        :style="{ background: rowTint(i), zIndex: milestones.length - i }"
      >
        <div class="mx-auto flex max-w-[1200px] items-start gap-4 px-4 py-[24px] sm:items-center sm:gap-[32px]">
          <span
            class="mt-[6px] size-[8px] shrink-0 rounded-full sm:mt-0"
            :style="{ background: dotColor(i) }"
            aria-hidden="true"
          />
          <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div class="font-display text-[18px] font-normal tracking-[1px] text-[rgba(20,20,20,0.8)] sm:text-[20px]">
              {{ m.year }}
            </div>
            <p class="text-sm font-extralight leading-[22px] text-[rgba(0,0,0,0.7)] sm:max-w-[710px] sm:text-[13px]">
              {{ m.body }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
