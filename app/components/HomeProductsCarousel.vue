<script setup lang="ts">
// Home product carousel — a "spotlight" carousel (Figma 238:9718). The active
// ("main") card is the largest and is pinned to the first-item slot; every other
// card shrinks with its distance from the active one, so it reads as a descending
// staircase on BOTH sides. Prev/next step exactly one card at a time.
const props = defineProps<{
  products: { slug: string; title: string; summary: string; image: string }[]
  label?: string
}>()
const { t } = useI18n()

const GAP = 51
// Symmetric size fall-off from the active card (distance 0 = biggest).
const cardW = (d: number) => Math.max(293, 353 - d * 15)
const cardH = (d: number) => Math.max(390, 470 - d * 20)

const active = ref(0)
// Snap back to the first card whenever the list changes (audience toggle).
watch(() => props.products.map((p) => p.slug).join('|'), () => { active.value = 0 })

const count = computed(() => props.products.length)
const atStart = computed(() => active.value <= 0)
const atEnd = computed(() => active.value >= count.value - 1)
function go(dir: 1 | -1) {
  active.value = Math.min(Math.max(active.value + dir, 0), count.value - 1)
}

// Shift the track left so the active card's leading edge lands on the main slot
// (the track's padding-left = --carousel-edge places that slot).
const trackOffset = computed(() => {
  let x = 0
  for (let k = 0; k < active.value; k++) x += cardW(active.value - k) + GAP
  return -x
})

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
      <div
        class="flex items-center pl-[var(--carousel-edge,1.5rem)] transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        :style="{ columnGap: `${GAP}px`, transform: `translateX(${trackOffset}px)` }"
      >
        <ProductCard
          v-for="(p, i) in products"
          :key="p.slug"
          :title="p.title"
          :summary="p.summary"
          :image="p.image"
          :to="`/products/${p.slug}`"
          :style="{ width: `${cardW(Math.abs(i - active))}px`, height: `${cardH(Math.abs(i - active))}px`, minHeight: 0 }"
          class="shrink-0 transition-[width,height] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />
      </div>

      <!-- Blurred peeks — previous cards on the left, upcoming on the right. -->
      <div
        v-show="!atStart"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 w-[100px] backdrop-blur-[6px] lg:w-[156px]"
        :style="{ maskImage: MASK_L, WebkitMaskImage: MASK_L }"
      />
      <div
        v-show="!atEnd"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 w-[100px] backdrop-blur-[6px] lg:w-[156px]"
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
