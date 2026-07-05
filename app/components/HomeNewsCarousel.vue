<script setup lang="ts">
// Home news carousel — full-bleed carousel of uniform-width cards that steps one
// at a time; the active card is pinned to the first-item slot with blurred peeks
// on either side. (Mirrors HomeProductsCarousel's layout/interaction, without the
// size ramp — every card is the same size.)
const props = defineProps<{
  items: { slug: string; title: string; excerpt?: string; image?: string; to?: string }[]
  label?: string
}>()
const { t } = useI18n()

const GAP = 40
const CARD_W = 408
const CARD_H = 420

const active = ref(0)
// Snap back to the first card whenever the list changes (locale switch).
watch(() => props.items.map((n) => n.slug).join('|'), () => { active.value = 0 })

const count = computed(() => props.items.length)
const atStart = computed(() => active.value <= 0)
const atEnd = computed(() => active.value >= count.value - 1)
function go(dir: 1 | -1) {
  active.value = Math.min(Math.max(active.value + dir, 0), count.value - 1)
}

// Shift the track left so the active card's leading edge lands on the main slot
// (the track's padding-left = --carousel-edge places that slot).
const trackOffset = computed(() => -active.value * (CARD_W + GAP))

const progress = computed(() => (count.value <= 1 ? 1 : active.value / (count.value - 1)))

const MASK_R = 'linear-gradient(to right, transparent, #000 60%)'
const MASK_L = 'linear-gradient(to left, transparent, #000 60%)'
</script>

<template>
  <div>
    <div
      class="relative overflow-hidden"
      role="group"
      :aria-label="label"
      tabindex="0"
      @keydown.left.prevent="go(-1)"
      @keydown.right.prevent="go(1)"
    >
      <!-- Fixed card height keeps the row uniform (news text lengths vary);
           overflow-hidden clips any overflow. -->
      <div
        class="flex h-[420px] items-start pl-[var(--carousel-edge,1.5rem)] transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :style="{ columnGap: `${GAP}px`, transform: `translateX(${trackOffset}px)` }"
      >
        <NewsCard
          v-for="n in items"
          :key="n.slug"
          :title="n.title"
          :excerpt="n.excerpt"
          :image="n.image"
          :to="n.to"
          :style="{ width: `${CARD_W}px`, height: `${CARD_H}px` }"
          class="shrink-0 overflow-hidden"
        />
      </div>

      <!-- Blurred peeks — previous cards on the left, upcoming on the right. -->
      <div
        v-show="!atStart"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 hidden w-[120px] backdrop-blur-[6px] md:block lg:w-[156px]"
        :style="{ maskImage: MASK_L, WebkitMaskImage: MASK_L }"
      />
      <div
        v-show="!atEnd"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 hidden w-[120px] backdrop-blur-[6px] md:block lg:w-[156px]"
        :style="{ maskImage: MASK_R, WebkitMaskImage: MASK_R }"
      />
    </div>

    <!-- Controls (stay aligned to the heading column) -->
    <div class="mt-8 flex items-center gap-8 px-[var(--carousel-edge,1.5rem)]">
      <div class="flex shrink-0 gap-6">
        <IconButton tone="light" direction="prev" :disabled="atStart" :label="t('common.prev')" @click="go(-1)" />
        <IconButton tone="light" direction="next" :disabled="atEnd" :label="t('common.next')" @click="go(1)" />
      </div>
      <div class="relative h-0.5 flex-1 rounded-full bg-black/10">
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-teal transition-[width] duration-300"
          :style="{ width: `${progress * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>
