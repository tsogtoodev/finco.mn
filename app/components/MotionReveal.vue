<script setup lang="ts">
// Reusable scroll-reveal wrapper built on motion-v.
// Usage: <MotionReveal :delay="0.1"><h2>…</h2></MotionReveal>
const props = withDefaults(
  defineProps<{
    /** Pixels to travel on the y-axis as it reveals. */
    y?: number
    /** Animation delay in seconds. */
    delay?: number
    /** Animation duration in seconds. */
    duration?: number
    /** Animate only the first time it enters the viewport. */
    once?: boolean
    /** Rendered element/tag. */
    as?: string
  }>(),
  {
    y: 24,
    delay: 0,
    duration: 0.6,
    once: true,
    as: 'div',
  },
)
</script>

<template>
  <Motion
    :as="as"
    :initial="{ opacity: 0, y: props.y }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :in-view-options="{ once: props.once, amount: 0.3 }"
    :transition="{ duration: props.duration, delay: props.delay, ease: [0.22, 1, 0.36, 1] }"
  >
    <slot />
  </Motion>
</template>
