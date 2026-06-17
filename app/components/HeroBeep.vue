<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ hero?: Collections['pages']['hero'] }>()
</script>

<template>
  <section v-if="hero" class="relative overflow-hidden bg-dark text-white">
    <!-- Ambient gradient -->
    <div class="pointer-events-none absolute inset-0 opacity-70">
      <div class="absolute -left-32 top-10 size-[28rem] rounded-full bg-primary/40 blur-[120px]" />
      <div class="absolute -right-24 bottom-0 size-[26rem] rounded-full bg-teal/30 blur-[120px]" />
    </div>

    <div class="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
      <div>
        <span v-if="hero.eyebrow" class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-teal ring-1 ring-white/15">
          <span class="size-1.5 rounded-full bg-teal" />
          {{ hero.eyebrow }}
        </span>
        <h1 class="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          {{ hero.headline }}
        </h1>
        <p v-if="hero.subheadline" class="mt-5 max-w-lg text-lg text-white/70">
          {{ hero.subheadline }}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <AppButton v-if="hero.cta" :to="hero.cta.to" variant="accent" size="lg" arrow>
            {{ hero.cta.label }}
          </AppButton>
          <AppButton
            v-if="hero.secondaryCta"
            :to="hero.secondaryCta.to"
            size="lg"
            class="!border-white/25 !text-white hover:!bg-white/10"
            variant="outline"
          >
            {{ hero.secondaryCta.label }}
          </AppButton>
        </div>
      </div>

      <!-- Visual -->
      <div class="relative hidden lg:block">
        <img
          v-if="hero.image"
          :src="hero.image"
          :alt="hero.headline"
          class="ml-auto w-full max-w-md rounded-[2rem] object-cover shadow-2xl"
        >
        <div v-else class="ml-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] bg-gradient-to-br from-primary/30 via-accent/20 to-teal/30 ring-1 ring-white/10 backdrop-blur" />
      </div>
    </div>
  </section>
</template>
