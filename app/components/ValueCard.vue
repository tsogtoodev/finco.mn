<script setup lang="ts">
// One value card (Figma 1:12332 etc.) — white card with a teal "cube" cluster
// graphic and aligned title/body. Row-1 cards carry the graphic at the bottom
// (text top); row-2 cards carry it at the top (text bottom).
import type { ValueItem } from '~/data/about'
import cube from '~/assets/images/fig-76f105c432.png'

const props = defineProps<{ item: ValueItem; graphic: 'top' | 'bottom' }>()

const alignClass = computed(() => ({
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
}[props.item.align]))
</script>

<template>
  <article
    class="relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[var(--radius)] bg-white p-8 shadow-2xs lg:min-h-[400px]"
    :class="graphic === 'top' ? 'justify-end' : 'justify-start'"
  >
    <!-- teal cube cluster + glow -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 flex items-center justify-center"
      :class="graphic === 'top' ? 'top-0 -mt-6' : 'bottom-0 -mb-6'"
    >
      <div class="absolute size-64 rounded-full bg-teal/25 blur-[70px]" />
      <img :src="cube" alt="" class="relative h-44 w-auto object-contain mix-blend-multiply lg:h-52">
    </div>

    <div class="relative z-10 flex flex-col gap-4" :class="alignClass">
      <h3 class="text-xl font-medium leading-7 text-[rgba(0,0,0,0.8)]">{{ item.title }}</h3>
      <p class="max-w-[28rem] text-base font-light leading-6 text-[rgba(0,0,0,0.6)]">{{ item.body }}</p>
    </div>
  </article>
</template>
