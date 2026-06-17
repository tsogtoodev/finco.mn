<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ value?: Collections['pages']['valueProps'] }>()
</script>

<template>
  <section v-if="value" class="mx-auto max-w-7xl px-4 py-20">
    <MotionReveal class="mx-auto max-w-2xl text-center">
      <h2 class="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {{ value.heading }}
        <span v-if="value.accent" class="text-accent">{{ value.accent }}</span>
      </h2>
      <p v-if="value.subheading" class="mt-4 text-lg text-muted-foreground">
        {{ value.subheading }}
      </p>
    </MotionReveal>

    <!-- Bento: tall lead card + two stacked -->
    <div class="mt-14 grid gap-5 lg:grid-cols-3">
      <MotionReveal
        v-for="(item, i) in value.items"
        :key="item.title"
        :delay="i * 0.08"
        :class="i === 0 ? 'lg:row-span-2' : ''"
        class="group relative flex flex-col justify-end overflow-hidden rounded-[--radius] bg-secondary p-7 ring-1 ring-black/5"
      >
        <!-- gradient blob -->
        <div class="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-gradient-to-br from-accent/40 via-primary/30 to-teal/30 blur-2xl transition-transform duration-500 group-hover:scale-110" />
        <div class="relative">
          <div class="flex size-12 items-center justify-center rounded-full bg-white text-accent shadow-2xs ring-1 ring-black/5">
            <Icon :name="item.icon || 'hugeicons:checkmark-circle-02'" class="size-6" />
          </div>
          <h3 class="mt-6 font-display text-xl font-semibold text-primary">{{ item.title }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">{{ item.body }}</p>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>
