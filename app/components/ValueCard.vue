<script setup lang="ts">
// One value card (Figma 238:7892…). A white rounded card that reveals a slice of a
// single teal cube-cluster image shared across its row: the same image is anchored
// to the row's horizontal centre in every card and each card's `overflow-hidden`
// clips it — so centre cards show the dense cluster while edge cards show only its
// faded edges, exactly as in Figma. Row-1 cards keep text at the top (cluster rises
// from the bottom); row-2 cards keep text at the bottom (cluster descends from top).
//
// The shared-cluster offsets only make sense once the cards sit side-by-side, so
// they apply via CSS vars at that breakpoint (lg for the 3-col top row, sm for the
// 2-col bottom row); while the cards are stacked the cluster is simply centred.
import type { ValueItem } from '~/data/about'
import cube from '~/assets/images/fig-76f105c432.png'

const props = defineProps<{
  item: ValueItem
  /** Columns in this card's row (3 for the top row, 2 for the bottom). */
  cols: number
  /** Zero-based position within the row. */
  index: number
  /** Which row — drives text position + cluster vertical placement. */
  row: 'top' | 'bottom'
}>()

const alignClass = computed(() => ({
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
}[props.item.align]))

// Per-card cluster geometry, exposed as CSS vars:
//  --cl horizontal anchor (image centre, paired with -translate-x-1/2) so the
//       cluster lands on the row centre no matter which card clips it,
//  --cw cube width — preserves Figma's image-to-row ratio (2284 / 1440 ≈ 1.586),
//  --gw glow halo width.
const vars = computed(() => {
  if (props.cols === 3) {
    return {
      '--cl': ['calc(150% + 16px)', '50%', 'calc(-50% - 16px)'][props.index],
      '--cw': 'calc(475.8% + 51px)',
      '--gw': 'calc(155% + 24px)',
    }
  }
  return {
    '--cl': ['calc(100% + 8px)', '-8px'][props.index],
    '--cw': 'calc(317.2% + 25px)',
    '--gw': 'calc(92% + 12px)',
  }
})

// Cluster centre sits just past the card's bottom edge (top row) or just above its
// top edge (bottom row).
const topClass = computed(() => (props.row === 'top' ? 'top-[calc(100%+5px)]' : 'top-[-15px]'))

// Apply the shared-row offset at the breakpoint where the cards line up.
const cubeBp = computed(() =>
  props.cols === 3 ? 'lg:left-[var(--cl)] lg:w-[var(--cw)]' : 'sm:left-[var(--cl)] sm:w-[var(--cw)]')
const glowBp = computed(() =>
  props.cols === 3 ? 'lg:left-[var(--cl)] lg:w-[var(--gw)]' : 'sm:left-[var(--cl)] sm:w-[var(--gw)]')
</script>

<template>
  <article
    class="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[12px] bg-white p-8 lg:h-[400px]"
    :class="row === 'top' ? 'justify-start' : 'justify-end'"
  >
    <!-- Soft teal halo + shared cube cluster, both clipped to this card -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 aspect-square w-[170%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/35 blur-[90px]"
      :class="[topClass, glowBp]"
      :style="vars"
    />
    <img
      :src="cube"
      aria-hidden="true"
      alt=""
      class="pointer-events-none absolute left-1/2 w-[260%] max-w-none -translate-x-1/2 -translate-y-1/2 mix-blend-multiply"
      :class="[topClass, cubeBp]"
      :style="vars"
    >

    <div class="relative z-10 flex flex-col gap-4" :class="alignClass">
      <h3 class="text-[20px] font-medium leading-7 text-[rgba(0,0,0,0.8)]">{{ item.title }}</h3>
      <p class="text-base font-light leading-6 text-[rgba(0,0,0,0.6)]">{{ item.body }}</p>
    </div>
  </article>
</template>
