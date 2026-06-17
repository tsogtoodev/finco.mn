<script setup lang="ts">
// One link inside a NavMegaMenu grid (Figma 1:11916 / 1:11775): title + one-line
// description + trailing chevron. The whole cell is a real <NuxtLink> so it is
// keyboard-focusable and routes correctly. `to` is a raw path, localised here.
const props = defineProps<{
  to: string
  title: string
  desc?: string
}>()

const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(props.to)"
    class="group flex flex-col gap-2 rounded-[var(--radius-sm)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
  >
    <span class="flex w-full items-center justify-between gap-3">
      <span class="text-base font-normal text-black/80 transition-colors group-hover:text-primary">
        {{ title }}
      </span>
      <Icon
        name="lucide:chevron-right"
        class="size-4 shrink-0 text-black/35 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </span>
    <span
      v-if="desc"
      class="max-w-[360px] text-[13px] font-extralight leading-[18px] tracking-[0.13px] text-black/60"
    >
      {{ desc }}
    </span>
  </NuxtLink>
</template>
