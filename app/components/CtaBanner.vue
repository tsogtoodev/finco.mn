<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ cta?: Collections['pages']['cta'] }>()
</script>

<template>
  <section v-if="cta" class="mx-auto max-w-7xl px-4 py-16">
    <MotionReveal class="relative overflow-hidden rounded-[1.5rem] bg-dark px-8 py-16 text-white sm:px-16">
      <div class="pointer-events-none absolute inset-0 flex justify-end opacity-30">
        <div v-for="n in 12" :key="n" class="h-full w-6 bg-gradient-to-b from-primary/0 via-accent/40 to-teal/0" :style="{ marginLeft: '8px' }" />
      </div>
      <div class="relative max-w-xl">
        <h2 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{{ cta.heading }}</h2>
        <p v-if="cta.body" class="mt-4 text-lg text-white/70">{{ cta.body }}</p>
        <AppButton v-if="cta.button" :to="cta.button.to" variant="accent" size="lg" arrow class="mt-8">
          {{ cta.button.label }}
        </AppButton>
      </div>
    </MotionReveal>
  </section>
</template>
