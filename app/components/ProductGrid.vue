<script setup lang="ts">
import type { Audience } from '~/composables/useProducts'

const props = defineProps<{ audience: Audience }>()
const localePath = useLocalePath()

const cards = await useProductList(props.audience)
</script>

<template>
  <section class="bg-[#fbfbfc] px-6 pb-20 pt-16 sm:pt-[80px]">
    <div class="mx-auto grid max-w-[1200px] gap-6 sm:grid-cols-2">
      <NuxtLink
        v-for="c in cards"
        :key="c.slug"
        :to="localePath(`/products/${c.slug}`)"
        class="group relative flex h-[240px] items-center justify-center overflow-hidden rounded-[12px]"
      >
        <NuxtImg
          v-if="c.heroImage"
          :src="c.heroImage"
          :alt="c.title"
          width="588"
          height="240"
          sizes="588px"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-black/50 transition-[background-color,backdrop-filter] duration-300 group-hover:bg-black/65 group-hover:backdrop-blur-[4.45px] group-focus-visible:bg-black/65 group-focus-visible:backdrop-blur-[4.45px] touch:bg-black/65 touch:backdrop-blur-[4.45px] motion-reduce:transition-none"
        />

        <h3
          class="absolute inset-x-6 top-1/2 -translate-y-1/2 text-balance text-center font-display font-extrabold text-white transition-transform duration-300 group-hover:-translate-y-[calc(100%+26.45px)] group-focus-visible:-translate-y-[calc(100%+26.45px)] touch:-translate-y-[calc(100%+26.45px)] motion-reduce:transition-none"
          :class="c.title.trim().split(/\s+/).length > 6 ? 'text-[18px] leading-[26px]' : 'text-[20px] leading-[28px]'"
        >
          {{ c.title }}
        </h3>

        <p
          v-if="c.summary"
          class="pointer-events-none absolute inset-x-6 top-[calc(50%+2px)] mx-auto max-w-[492px] -translate-y-1/2 text-center text-base font-extralight leading-5 text-white opacity-0 transition-opacity duration-300 line-clamp-2 group-hover:opacity-100 group-focus-visible:opacity-100 touch:opacity-100 motion-reduce:transition-none"
        >
          {{ c.summary }}
        </p>

        <span
          class="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-0.5 px-6 py-4 text-lg font-semibold leading-9 text-white opacity-0 transition-[transform,opacity] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 touch:translate-y-0 touch:opacity-100 motion-reduce:transition-none"
        >
          <span class="flex-1 text-left">{{ $t('common.learnMore') }}</span>
          <Icon name="lucide:arrow-right" class="size-4 shrink-0" />
        </span>
      </NuxtLink>
    </div>
  </section>
</template>
