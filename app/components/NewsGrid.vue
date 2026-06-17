<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ items?: Collections['news'][] }>()
const { t } = useI18n()
</script>

<template>
  <section v-if="items?.length" class="mx-auto max-w-7xl px-4 py-20">
    <div class="flex items-end justify-between gap-6">
      <MotionReveal>
        <h2 class="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {{ t('nav.news') }}
        </h2>
      </MotionReveal>
      <AppButton to="/" variant="outline" arrow class="hidden sm:inline-flex">
        {{ t('common.learnMore') }}
      </AppButton>
    </div>

    <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <MotionReveal v-for="(n, i) in items" :key="n.slug" :delay="i * 0.06">
        <NewsCard :item="n" />
      </MotionReveal>
    </div>
  </section>
</template>
