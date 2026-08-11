<script setup lang="ts">
import { useInView } from 'motion-v'

type Keyframe = Record<string, string | number>

const props = withDefaults(
  defineProps<{
    /** Text content to animate. */
    text?: string
    /** Delay between each word/letter, in ms. */
    delay?: number
    /** Animate by whole 'words' or individual 'letters'. */
    animateBy?: 'words' | 'letters'
    /** Direction the segments travel in from. */
    direction?: 'top' | 'bottom'
    /** Intersection threshold (0–1) that triggers the animation. */
    threshold?: number
    /** Root margin for the intersection observer. */
    rootMargin?: string
    /** Override the initial (from) keyframe. */
    animationFrom?: Keyframe
    /** Override the animation (to) keyframes. */
    animationTo?: Keyframe[]
    /** Easing function applied across the keyframes. */
    easing?: (t: number) => number
    /** Time each step takes, in seconds. */
    stepDuration?: number
    /** Root element tag (e.g. 'h1', 'span'). Defaults to 'p'. */
    as?: string
    /** Seconds to wait before the first segment — staggers whole blocks. */
    startDelay?: number
  }>(),
  {
    text: '',
    delay: 200,
    animateBy: 'words',
    direction: 'top',
    threshold: 0.1,
    rootMargin: '0px',
    animationFrom: undefined,
    animationTo: undefined,
    easing: (t: number) => t,
    stepDuration: 0.22,
    as: 'p',
    startDelay: 0,
  },
)

const emit = defineEmits<{ animationComplete: [] }>()

const rootEl = ref<HTMLParagraphElement | null>(null)
const inView = useInView(rootEl, {
  once: true,
  amount: props.threshold,
  margin: props.rootMargin,
})

const segments = computed(() =>
  props.animateBy === 'words' ? props.text.split(' ') : props.text.split(''),
)

const defaultFrom = computed<Keyframe>(() =>
  props.direction === 'top'
    ? { filter: 'blur(10px)', opacity: 0, y: -20 }
    : { filter: 'blur(10px)', opacity: 0, y: 20 },
)

const defaultTo = computed<Keyframe[]>(() => [
  { filter: 'blur(5px)', opacity: 0.5, y: props.direction === 'top' ? 5 : -5 },
  { filter: 'blur(0px)', opacity: 1, y: 0 },
])

const fromSnapshot = computed<Keyframe>(() => props.animationFrom ?? defaultFrom.value)
const toSnapshots = computed<Keyframe[]>(() => props.animationTo ?? defaultTo.value)

const animateKeyframes = computed<Record<string, Array<string | number>>>(() => {
  const from = fromSnapshot.value
  const steps = toSnapshots.value
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))])
  const keyframes: Record<string, Array<string | number>> = {}
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])]
  })
  return keyframes
})

const stepCount = computed(() => toSnapshots.value.length + 1)
const totalDuration = computed(() => props.stepDuration * (stepCount.value - 1))
const times = computed(() =>
  Array.from({ length: stepCount.value }, (_, i) =>
    stepCount.value === 1 ? 0 : i / (stepCount.value - 1),
  ),
)

function spanTransition(index: number) {
  return {
    duration: totalDuration.value,
    times: times.value,
    delay: props.startDelay + (index * props.delay) / 1000,
    ease: props.easing,
  }
}

function displaySegment(segment: string, index: number): string {
  const base = segment === ' ' ? ' ' : segment
  const trailing =
    props.animateBy === 'words' && index < segments.value.length - 1 ? ' ' : ''
  return base + trailing
}

const settled = ref(false)
function handleComplete() {
  settled.value = true
  emit('animationComplete')
}
</script>

<template>
  <component
    :is="as"
    ref="rootEl"
    :class="settled ? 'blurtext-settled' : undefined"
    style="display: flex; flex-wrap: wrap"
  >
    <Motion
      v-for="(segment, index) in segments"
      :key="index"
      as="span"
      :initial="fromSnapshot"
      :animate="inView ? animateKeyframes : fromSnapshot"
      :transition="spanTransition(index)"
      :style="{ display: 'inline-block' }"
      :on-animation-complete="index === segments.length - 1 ? handleComplete : undefined"
    >{{ displaySegment(segment, index) }}</Motion>
  </component>
</template>

<style scoped>
.blurtext-settled > :deep(span) {
  filter: none !important;
  transform: none !important;
  will-change: auto !important;
}
</style>
