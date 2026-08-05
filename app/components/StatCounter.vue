<script setup lang="ts">
import { useInView } from 'motion-v'

// Counts up to `value` when scrolled into view, with smooth digit transitions via
// @number-flow/vue (AppNumberFlow). Renders the FINAL value during SSR / before JS
// (good for SEO + no-JS); on the client it resets to 0 while off-screen, then flows
// to `value` on enter (flash-free below fold). Honours prefers-reduced-motion
// (no reset; NumberFlow also skips its animation).
//
// `replay` re-runs the count-up: bump it (any new value) and, if the counter is
// on screen, it travels from 0 again. HomeStats drives it from its background
// loop so the numbers re-reveal in time with the video.
const props = withDefaults(
  defineProps<{ value: number; suffix?: string; duration?: number; replay?: number }>(),
  { duration: 1.6 },
)

const el = ref<HTMLElement | null>(null)
const isInView = useInView(el, { once: true, amount: 0.5 })
const display = ref(props.value)
// Bumped to remount NumberFlow, which is how the reset to 0 happens without
// animating a spin DOWN first — a fresh instance just renders 0.
const instance = ref(0)

let reduced = false
let replayTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Reset so the count-up has somewhere to travel from (only if still off-screen).
  if (!reduced && !isInView.value) display.value = 0
})

watch(isInView, (visible) => {
  if (visible) display.value = props.value
})

watch(() => props.replay, async () => {
  if (reduced || !isInView.value) return
  if (replayTimer !== null) clearTimeout(replayTimer)
  display.value = 0
  instance.value++
  await nextTick()
  // A beat between the reset and the target, or Vue coalesces them into one
  // render and NumberFlow has nothing to animate. A timer rather than rAF: rAF
  // is frozen in a backgrounded tab, which would strand the numbers at 0.
  replayTimer = setTimeout(() => {
    display.value = props.value
  }, 50)
})

onBeforeUnmount(() => {
  if (replayTimer !== null) clearTimeout(replayTimer)
})

const timing = computed(() => ({
  duration: props.duration * 1000,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
}))
</script>

<template>
  <span ref="el" class="tabular-nums">
    <AppNumberFlow
      :key="instance"
      :value="display"
      :suffix="suffix"
      locales="en-US"
      :spin-timing="timing"
      :transform-timing="timing"
    />
  </span>
</template>
