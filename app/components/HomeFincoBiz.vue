<script setup lang="ts">
// FincoBiz showcase (Figma 1:14224 + the 2026-07 card bodies 782:15408 /
// 782:15445 / 782:15469): FincoBiz wordmark + intro + accent CTA, then the
// platform as a live deck of three stacked browser cards. Clicking a peeked
// card brings it to the front (the others shift back one slot).
//
// Every card now carries the designer's own body: a teal heading + supporting
// line on the left and that card's product screenshot bleeding off the right
// edge. The screenshots are node exports whose crop is already baked in by the
// Figma frame, so each is placed at its own width flush to the right — see
// `art` below. (This replaced one baked full-card raster with masked overlay
// text, plus two hand-built skeleton UIs.)
//
// Copy comes from the `pages` home doc's fincobiz group where fields exist,
// with i18n as the fallback and the source for the new per-card strings.
const { t } = useI18n()

const page = await usePageContent('home')
const copy = computed(() => ({
  subtext: page.value?.fincobiz?.subtext ?? t('home.fincobiz.subtext'),
}))

type CardId = 'eligibility' | 'receivables' | 'request'

// Artwork width as a % of the 1152px design body, each flush to the right edge
// (Figma clips them there): eligibility 566.6px, receivables 576px, request
// 514.1px. Heights are the full 397px body, and the exports' aspect ratios
// match, so `object-cover` can't distort them.
const cards = [
  { id: 'eligibility' as CardId, dot: '#12b76a', art: '49.18%' },
  { id: 'receivables' as CardId, dot: '#4e83fd', art: '50%' },
  { id: 'request' as CardId, dot: '#f7b23b', art: '44.63%' },
]

// The request card's heading/body map onto the callout fields editors already
// have in Directus; the other two are i18n-only until matching CMS fields exist.
function cardCopy(id: CardId) {
  const cms = page.value?.fincobiz
  return {
    tab: cms?.cards?.[id] ?? t(`home.fincobiz.cards.${id}.tab`),
    heading: (id === 'request' ? cms?.calloutHeading : undefined) ?? t(`home.fincobiz.cards.${id}.heading`),
    body: (id === 'request' ? cms?.calloutSubtext : undefined) ?? t(`home.fincobiz.cards.${id}.body`),
  }
}

// Front-first stacking order; depth 0 = front, 2 = back (matches the mockup).
const order = ref<CardId[]>(['request', 'receivables', 'eligibility'])
const depth = (id: CardId) => order.value.indexOf(id)
function promote(id: CardId) {
  if (order.value[0] === id) return
  order.value = [id, ...order.value.filter((c) => c !== id)]
}

// Auto-advance: every 5s bring the back card forward so the deck cycles on its
// own. Any manual click restarts the timer; pointer hover pauses it so users can
// read the peeked card, and it stops entirely off-screen / on unmount.
const AUTO_MS = 5000
let timer: ReturnType<typeof setInterval> | null = null
function advance() {
  const back = order.value[order.value.length - 1]
  if (back) promote(back)
}
function stopAuto() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function startAuto() {
  stopAuto()
  timer = setInterval(advance, AUTO_MS)
}
function onPromote(id: CardId) {
  promote(id)
  startAuto()
}
onMounted(startAuto)
onBeforeUnmount(stopAuto)
</script>

<template>
  <section class="relative overflow-hidden bg-white py-24 lg:py-28">
    <!-- Background wash (Figma 568:5696) — a soft lavender → violet → magenta
         S-curve. See the .biz-blob rules below for why it's CSS, not the raster. -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <span class="biz-blob biz-blob--violet" />
      <span class="biz-blob biz-blob--periwinkle" />
      <span class="biz-blob biz-blob--magenta" />
    </div>

    <div class="relative mx-auto w-full max-w-[1200px] px-6">
      <MotionReveal class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="max-w-[750px]">
          <img src="/images/home/fincobiz-logo.svg" alt="FincoBiz" class="block h-auto w-[190px]">
          <p class="mt-4 text-lg font-extralight leading-7 tracking-[0.01em] text-black/60">
            {{ copy.subtext }}
          </p>
        </div>
        <AppButton to="/business" variant="accent" pill arrow class="h-10 shrink-0">
          {{ t('common.learnMore') }}
        </AppButton>
      </MotionReveal>

      <MotionReveal :delay="0.1" class="relative mt-16">
        <div class="[container-type:inline-size]">
          <!-- headroom for the two peeked headers above the front card -->
          <div
            class="biz-stack relative pt-[max(8cqw,88px)]"
            @pointerenter="stopAuto"
            @pointerleave="startAuto"
          >
            <!-- Card height is `h-auto` below lg. The 450px is a desktop crop
                 height: there the mockup renders taller than the card and is
                 deliberately clipped, but at a 327px container it is only ~150px
                 tall, so the fixed height left ~256px of blank white inside the
                 card. The two skeleton cards are `absolute inset-0` and their
                 bodies are `flex-1`, so they follow the front card's height. -->
            <div class="relative">
              <article
                v-for="card in cards"
                :key="card.id"
                class="biz-card flex h-auto flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06] [will-change:transform] lg:h-[450px]"
                :class="[
                  depth(card.id) === 0 ? 'is-front' : '',
                  card.id === 'request' ? 'relative' : 'absolute inset-0',
                ]"
                :style="{ '--depth': depth(card.id), zIndex: 3 - depth(card.id) }"
                @click="onPromote(card.id)"
              >
                <!-- browser-chrome header: the clickable, translatable tab -->
                <button
                  type="button"
                  class="flex w-full shrink-0 items-center gap-3 border-b border-black/[0.06] bg-[#fbfbfc] px-5 py-3 text-left sm:py-3.5"
                  :aria-expanded="depth(card.id) === 0"
                >
                  <span aria-hidden="true" class="biz-dot" :style="{ background: card.dot }" />
                  <span class="text-sm font-normal text-black/80 sm:text-base">
                    {{ cardCopy(card.id).tab }}
                  </span>
                </button>

                <!-- Card body (Figma 782:15408 / 15445 / 15469): copy left,
                     that card's screenshot bleeding off the right edge. Below lg
                     the two stack — a 1152px-wide screenshot is unreadable at a
                     327px card, so it reads as artwork under the copy instead of
                     shrinking the text to match it. -->
                <div class="relative flex min-h-0 flex-1 flex-col lg:block">
                  <div
                    class="px-5 pb-4 pt-5 lg:absolute lg:left-[5.21%] lg:top-[15.11%] lg:w-[30.85%] lg:p-0"
                  >
                    <h3
                      class="font-display text-lg font-bold leading-6 text-[#2de0c6] lg:text-2xl lg:leading-[30px]"
                    >
                      {{ cardCopy(card.id).heading }}
                    </h3>
                    <p
                      class="mt-2 text-sm font-extralight leading-[22px] text-black/60 lg:mt-3 lg:text-[18px] lg:leading-[28px] lg:tracking-[0.18px]"
                    >
                      {{ cardCopy(card.id).body }}
                    </p>
                  </div>

                  <NuxtImg
                    :src="`/images/home/fincobiz-card-${card.id}.png`"
                    alt=""
                    aria-hidden="true"
                    :width="1152"
                    :height="794"
                    sizes="100vw lg:600px"
                    class="mt-auto block w-full object-cover lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-full"
                    :style="{ '--art-w': card.art }"
                  />
                </div>
              </article>
            </div>
          </div>
        </div>
      </MotionReveal>
    </div>
  </section>
</template>

<style scoped>
/* Deck geometry: depth d sits d peeks higher and 4% smaller. The origin is
   top-centre so each deeper card insets by the same amount on the left and the
   right (scaling about the centre splits the width loss evenly), while `top`
   keeps the vertical peek stagger anchored. Promotion just changes --depth per
   card — the transform transition carries the reorder (z-index snaps, but the
   moving card covers the swap). */
.biz-stack {
  --peek: max(4cqw, 44px);
}

.biz-card {
  transform: translateY(calc(var(--depth) * var(--peek) * -1)) scale(calc(1 - var(--depth) * 0.04));
  transform-origin: top center;
  /* Layered elevation: a tight contact shadow, a mid drop, and a broad soft
     pool. The mid layer keeps only a small negative spread so the shadow still
     reads on the narrow left/right peeks, not just below the front card. */
  box-shadow:
    0 1px 2px rgba(23, 16, 84, 0.05),
    0 10px 22px -8px rgba(23, 16, 84, 0.16),
    0 34px 64px -26px rgba(23, 16, 84, 0.28);
  transition:
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.6s ease,
    filter 0.6s ease;
}

/* Back cards read as inactive: a whisper darker, full brightness + a nudge on
   hover as the click affordance. The front card is inert (promote no-ops). */
.biz-card:not(.is-front) {
  cursor: pointer;
  filter: brightness(0.985);
}
.biz-card:not(.is-front):hover {
  transform: translateY(calc(var(--depth) * var(--peek) * -1 - 6px)) scale(calc(1 - var(--depth) * 0.04));
  filter: brightness(1);
}
.biz-card.is-front > button {
  cursor: default;
}

/* Background wash (Figma 568:5696). The Figma layer is a 4096px / 7.8MB raster
   of a blurred S-curve, of which the frame only ever shows the middle ~36%.
   Rebuilt here as three radial lobes — same sampled colours, zero bytes, scales
   to any width, and can actually move. Each lobe drifts on its own slow,
   deliberately non-matching cycle (26/32/38s) so the wash breathes rather than
   pulsing in visible lockstep. Positions place the violet crest centre-high with
   the periwinkle and magenta lobes low-left and low-right, tracing the S. */
.biz-blob {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

.biz-blob--violet {
  left: 22.5%;
  top: 14%;
  width: 55%;
  height: 46%;
  background: radial-gradient(closest-side, rgba(172, 88, 245, 0.22), rgba(172, 88, 245, 0) 72%);
  animation: biz-drift-a 26s ease-in-out infinite alternate;
}

.biz-blob--periwinkle {
  left: -13%;
  top: 58%;
  width: 52%;
  height: 44%;
  background: radial-gradient(closest-side, rgba(152, 142, 240, 0.2), rgba(152, 142, 240, 0) 72%);
  animation: biz-drift-b 32s ease-in-out infinite alternate;
}

.biz-blob--magenta {
  left: 68%;
  top: 62%;
  width: 52%;
  height: 44%;
  background: radial-gradient(closest-side, rgba(170, 100, 235, 0.18), rgba(170, 100, 235, 0) 72%);
  animation: biz-drift-c 38s ease-in-out infinite alternate;
}

@keyframes biz-drift-a {
  from { transform: translate3d(-2%, 2%, 0) scale(1); }
  to { transform: translate3d(3%, -3%, 0) scale(1.07); }
}

@keyframes biz-drift-b {
  from { transform: translate3d(0, 0, 0) scale(1.04); }
  to { transform: translate3d(5%, -4%, 0) scale(0.96); }
}

@keyframes biz-drift-c {
  from { transform: translate3d(2%, 0, 0) scale(1); }
  to { transform: translate3d(-4%, -3%, 0) scale(1.08); }
}

/* Per-card artwork width (set inline as --art-w); only applies once the body
   switches to the side-by-side desktop layout. */
@media (min-width: 1024px) {
  .biz-card img {
    width: var(--art-w);
  }
}

/* organic pebble, like the baked tab dots */
.biz-dot {
  width: 15px;
  height: 15px;
  flex: none;
  border-radius: 62% 38% 55% 45% / 55% 62% 38% 45%;
}

@media (prefers-reduced-motion: reduce) {
  .biz-card {
    transition-duration: 0.01ms;
  }

  /* Keep the wash, drop the drift. */
  .biz-blob {
    animation: none;
  }
}
</style>
