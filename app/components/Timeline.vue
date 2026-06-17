<script setup lang="ts">
// Shared timeline. `orientation: vertical` (About story) | `horizontal`
// (Careers recruitment). Items: { year/step label, title, body? }.
withDefaults(
  defineProps<{
    items: { label: string; title: string; body?: string }[]
    orientation?: 'vertical' | 'horizontal'
  }>(),
  { orientation: 'vertical' },
)
</script>

<template>
  <!-- Vertical -->
  <ol v-if="orientation === 'vertical'" class="relative space-y-10 border-l-2 border-input pl-8">
    <MotionReveal v-for="(m, i) in items" :key="i" :delay="i * 0.08" as="li">
      <span class="absolute -left-[9px] mt-1.5 size-4 rounded-full border-2 border-primary bg-background" />
      <div class="font-display text-sm font-bold text-accent">{{ m.label }}</div>
      <h3 class="mt-1 font-display text-lg font-semibold text-foreground">{{ m.title }}</h3>
      <p v-if="m.body" class="mt-1 text-muted-foreground">{{ m.body }}</p>
    </MotionReveal>
  </ol>

  <!-- Horizontal -->
  <div v-else class="relative">
    <div class="absolute left-0 right-0 top-2 hidden h-0.5 bg-input md:block" />
    <ol class="grid gap-8 md:grid-cols-3 lg:grid-cols-6">
      <MotionReveal v-for="(m, i) in items" :key="i" :delay="i * 0.06" as="li" class="relative">
        <span class="block size-4 rounded-full border-2 border-primary bg-primary" />
        <div class="mt-4 font-display text-sm font-semibold text-foreground">{{ m.title }}</div>
        <div v-if="m.label" class="mt-1 text-xs text-muted-foreground">{{ m.label }}</div>
      </MotionReveal>
    </ol>
  </div>
</template>
