<script setup lang="ts">
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
    class="group flex flex-col gap-2 rounded-xl p-3 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-primary/40"
  >
    <span class="flex w-full items-center justify-between gap-3">
      <span class="text-sm font-medium text-black/80">
        {{ title }}
      </span>
      <Icon
        name="lucide:chevron-right"
        class="size-4 shrink-0 text-black/35 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </span>
    <span
      v-if="desc"
      class="text-xs font-extralight leading-4 tracking-[0.12px] text-black/50"
    >
      {{ desc }}
    </span>
  </NuxtLink>
</template>
