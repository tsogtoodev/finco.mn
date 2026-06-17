<script setup lang="ts">
import type { Collections } from '@nuxt/content'

defineProps<{ products?: Collections['products'][]; heading?: string }>()
const { t } = useI18n()

const scroller = ref<HTMLElement | null>(null)
function scrollBy(dir: number) {
  scroller.value?.scrollBy({ left: dir * 360, behavior: 'smooth' })
}
</script>

<template>
  <section v-if="products?.length" class="mx-auto max-w-7xl px-4 py-20">
    <div class="flex items-end justify-between gap-6">
      <MotionReveal>
        <h2 class="max-w-xl font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {{ heading || t('nav.products') }}
        </h2>
      </MotionReveal>
      <div class="hidden shrink-0 gap-2 sm:flex">
        <button
          type="button"
          aria-label="Previous"
          class="flex size-11 items-center justify-center rounded-full border border-input text-foreground transition-colors hover:border-primary hover:text-primary"
          @click="scrollBy(-1)"
        >
          <Icon name="lucide:arrow-left" class="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          class="flex size-11 items-center justify-center rounded-full border border-input text-foreground transition-colors hover:border-primary hover:text-primary"
          @click="scrollBy(1)"
        >
          <Icon name="lucide:arrow-right" class="size-5" />
        </button>
      </div>
    </div>

    <div
      ref="scroller"
      class="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ProductCard
        v-for="p in products"
        :key="p.slug"
        :product="p"
        class="w-[300px] shrink-0 snap-start"
      />
    </div>
  </section>
</template>
