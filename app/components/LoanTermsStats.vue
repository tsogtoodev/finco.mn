<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ terms: NonNullable<Collections['products']['loanTerms']> }>()
const { t } = useI18n()
</script>

<template>
  <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div
      v-for="(item, key) in { amount: terms.amount, rate: terms.rate, period: terms.period }"
      :key="key"
      class="rounded-[--radius] bg-secondary p-5 text-center ring-1 ring-black/5"
    >
      <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {{ t(`loanTerms.${key}`) }}
      </dt>
      <dd class="mt-2 font-display text-xl font-bold text-primary">{{ item }}</dd>
    </div>
  </dl>
</template>
