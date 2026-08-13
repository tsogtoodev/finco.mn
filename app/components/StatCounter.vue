<script setup lang="ts">
import { useInView } from 'motion-v'

const props = withDefaults(
  defineProps<{ value: number; suffix?: string; duration?: number; replay?: number }>(),
  { duration: 1.6 },
)

const el = ref<HTMLElement | null>(null)
const isInView = useInView(el, { once: true, amount: 0.5 })
const display = ref(props.value)
const instance = ref(0)

let reduced = false
let replayTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
