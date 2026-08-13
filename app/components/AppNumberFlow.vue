<script setup lang="ts">
import NumberFlow from '@number-flow/vue'

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
