<script setup lang="ts">
// Bento feature card (Figma 1:14128/1:14137/1:14145): purple gradient blob behind,
// white fade at the bottom for legibility, icon chip top-left, title + body bottom.
defineProps<{
  icon: string
  title: string
  body: string
  /** Decorative gradient-blob image (imported asset URL). */
  image: string
}>()
</script>

<template>
  <div
    class="relative isolate min-h-[254px] overflow-hidden rounded-[var(--radius)] border border-accent/5 bg-[#f6f6ff]"
  >
    <!-- Gradient blob -->
    <NuxtImg
      :src="image"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full object-cover"
    />
    <!-- Legibility fade -->
    <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f6f6ff] via-[#f6f6ff] to-transparent" />

    <!-- Icon chip -->
    <div class="absolute left-5 top-5 flex size-13 items-center justify-center rounded-[var(--radius)] bg-white/60 backdrop-blur-sm">
      <Icon :name="icon" class="size-8 text-accent" />
    </div>

    <!-- Copy -->
    <div class="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-8">
      <h3 class="font-display text-[22px] font-semibold leading-7 text-accent">{{ title }}</h3>
      <p class="max-w-[556px] text-base font-light leading-6 tracking-[0.01em] text-black/60">{{ body }}</p>
    </div>
  </div>
</template>
