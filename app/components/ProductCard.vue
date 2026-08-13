<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{
  product?: Collections['products']
  title?: string
  summary?: string
  image?: string
  category?: string
  to?: string
}>()

const localePath = useLocalePath()
const NuxtLink = resolveComponent('NuxtLink')

const title = computed(() => props.title ?? props.product?.title ?? '')
const summary = computed(() => props.summary ?? props.product?.summary ?? '')
const image = computed(() => props.image ?? props.product?.heroImage)
const category = computed(() => props.category ?? props.product?.category)
const to = computed(() =>
  props.to ?? (props.product ? `/products/${props.product.slug}` : undefined),
)
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to ? localePath(to) : undefined"
    class="group relative flex h-full min-h-[420px] flex-col justify-end overflow-hidden rounded-[var(--radius)] bg-[#06322d]"
  >
    <NuxtImg
      v-if="image"
      :src="image"
      :alt="title"
      loading="lazy"
      sizes="360px"
      class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-[rgba(4,20,18,0.85)] via-[rgba(4,20,18,0.35)] to-transparent" />

    <div class="relative flex flex-col gap-3 p-6 pb-7">
      <h3 class="font-display text-xl font-extrabold leading-7 text-white">{{ title }}</h3>
      <p v-if="summary" class="line-clamp-3 text-[15px] font-light leading-6 text-white/70">{{ summary }}</p>
      <div class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] touch:grid-rows-[1fr] motion-reduce:transition-none">
        <div class="overflow-hidden">
          <span
            class="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:delay-75 group-focus-visible:opacity-100 touch:opacity-100 motion-reduce:transition-none"
          >
            {{ $t('common.learnMore') }}
            <Icon name="lucide:arrow-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  </component>
</template>
