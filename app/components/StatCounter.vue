<script setup lang="ts">
import { useInView } from 'motion-v'

// Counts up to `value` when scrolled into view. Renders the FINAL value during
// SSR / before JS (good for SEO + no-JS); on the client it resets to 0 while
// off-screen, then animates when it enters the viewport (flash-free below fold).
const props = withDefaults(
  defineProps<{ value: number; suffix?: string; duration?: number }>(),
  { duration: 1.6 },
)

const el = ref<HTMLElement | null>(null)
const isInView = useInView(el, { once: true, amount: 0.5 })
const display = ref(props.value)
let started = false

function formatNumber(n: number) {
  return Math.round(n).toLocaleString('en-US')
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // If animation is wanted and the element isn't on screen yet, reset to 0 so
  // the count-up has somewhere to travel from.
  if (!reduced && !isInView.value) display.value = 0
})

watch(isInView, (visible) => {
  if (!visible || started) return
  started = true
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) { display.value = props.value; return }

  const start = performance.now()
  const to = props.value
  const ms = props.duration * 1000
  function tick(now: number) {
    const t = Math.min((now - start) / ms, 1)
    display.value = to * (1 - Math.pow(1 - t, 3)) // easeOutCubic
    if (t < 1) requestAnimationFrame(tick)
    else display.value = to
  }
  requestAnimationFrame(tick)
})
</script>

<template>
  <span ref="el" class="tabular-nums">{{ formatNumber(display) }}<span v-if="suffix">{{ suffix }}</span></span>
</template>
