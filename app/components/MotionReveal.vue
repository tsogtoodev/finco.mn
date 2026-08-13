<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    y?: number
    delay?: number
    duration?: number
    once?: boolean
    as?: string
  }>(),
  {
    y: 128,
    delay: 0,
    duration: 0.8,
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
