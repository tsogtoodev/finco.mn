<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{
  item?: Collections['news']
  title?: string
  excerpt?: string
  image?: string
  to?: string
  compact?: boolean
}>()

const localePath = useLocalePath()
const NuxtLink = resolveComponent('NuxtLink')
const title = computed(() => props.title ?? props.item?.title ?? '')
const excerpt = computed(() => props.excerpt ?? props.item?.summary)
const image = computed(() => props.image ?? props.item?.image)
const to = computed(
  () => props.to ?? props.item?.to ?? (props.item?.slug ? `/news/${props.item.slug}` : undefined),
)
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to ? localePath(to) : undefined"
    class="group flex flex-col gap-6"
  >
    <div
      class="overflow-hidden rounded-tr-[90px] bg-muted"
      :class="compact ? 'h-[184px] rounded-[8px]' : 'h-[282px] rounded-[var(--radius)]'"
    >
      <NuxtImg
        v-if="image"
        :src="image"
        :alt="title"
        loading="lazy"
        sizes="90vw sm:408px"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105 border-top-right-radius-[90px]"
      />
      <div v-else class="size-full bg-gradient-to-br from-primary/15 via-accent/10 to-teal/15" />
    </div>
    <div class="flex flex-col gap-3">
      <h3
        class="font-display text-lg font-medium leading-snug text-black/90 transition-colors group-hover:text-accent"
        :class="compact ? 'line-clamp-2' : 'truncate'"
      >
        {{ title }}
      </h3>
      <p v-if="excerpt" class="line-clamp-3 text-base font-extralight leading-6 text-black/60">{{ excerpt }}</p>
    </div>
  </component>
</template>
