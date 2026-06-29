<script setup lang="ts">
import NumberFlow from '@number-flow/vue'

// Shared number-transition primitive (wraps @number-flow/vue). Animates between
// value changes and — with a parent in-view trigger — count-ups. Defaults to
// mn-MN grouping; NumberFlow honours prefers-reduced-motion automatically.
// Extra NumberFlow props (spinTiming, transformTiming, trend, …) pass through
// via Vue attribute fallthrough onto the single NumberFlow root.
withDefaults(
  defineProps<{
    value: number
    format?: Intl.NumberFormatOptions
    prefix?: string
    suffix?: string
    locales?: Intl.LocalesArgument
  }>(),
  { locales: 'mn-MN' },
)
</script>

<template>
  <NumberFlow
    :value="value"
    :format="format"
    :locales="locales"
    :prefix="prefix"
    :suffix="suffix"
    :will-change="true"
    class="tabular-nums"
  />
</template>
