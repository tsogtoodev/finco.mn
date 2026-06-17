<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ heading?: string; stats?: Collections['pages']['stats'] }>()
</script>

<template>
  <section v-if="stats?.length" class="relative overflow-hidden bg-dark py-20 text-white">
    <!-- Aurora wave backdrop (approximation of the Figma graphic) -->
    <div class="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-80">
      <div class="absolute left-1/4 top-6 h-40 w-1/2 -translate-x-1/2 rounded-[100%] bg-gradient-to-r from-primary via-accent to-teal blur-[80px]" />
      <div class="absolute left-1/2 top-0 h-32 w-2/3 -translate-x-1/2 rounded-[100%] bg-gradient-to-r from-teal/60 via-primary/60 to-accent/70 blur-[90px]" />
    </div>

    <div class="relative mx-auto max-w-7xl px-4">
      <h2 v-if="heading" class="text-center font-display text-2xl font-semibold sm:text-3xl">
        {{ heading }}
      </h2>
      <dl class="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
        <div
          v-for="(s, i) in stats"
          :key="s.label"
          class="text-center sm:border-l sm:border-white/10 sm:first:border-l-0"
          :class="i > 0 ? 'sm:border-l' : ''"
        >
          <dt class="font-display text-4xl font-bold sm:text-5xl">
            <StatCounter :value="s.value" :suffix="s.suffix" />
          </dt>
          <dd class="mx-auto mt-3 max-w-[14rem] text-sm text-white/60">{{ s.label }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
