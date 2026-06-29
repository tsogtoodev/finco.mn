<script setup lang="ts">
import { useInView } from 'motion-v'

// Counts up to `value` when scrolled into view, with smooth digit transitions via
// @number-flow/vue (AppNumberFlow). Renders the FINAL value during SSR / before JS
// (good for SEO + no-JS); on the client it resets to 0 while off-screen, then flows
// to `value` on enter (flash-free below fold). Honours prefers-reduced-motion
// (no reset; NumberFlow also skips its animation).
const props = withDefaults(
  defineProps<{ value: number; suffix?: string; duration?: number }>(),
  { duration: 1.6 },
)

const el = ref<HTMLElement | null>(null)
const isInView = useInView(el, { once: true, amount: 0.5 })
const display = ref(props.value)

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Reset so the count-up has somewhere to travel from (only if still off-screen).
  if (!reduced && !isInView.value) display.value = 0
})

watch(isInView, (visible) => {
  if (visible) display.value = props.value
})

const timing = computed(() => ({
  duration: props.duration * 1000,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
}))
</script>

<template>
  <span ref="el" class="tabular-nums">
    <AppNumberFlow
      :value="display"
      :suffix="suffix"
      locales="en-US"
      :spin-timing="timing"
      :transform-timing="timing"
    />
  </span>
</template>
