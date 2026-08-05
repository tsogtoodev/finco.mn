<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')
const copy = computed(() => ({
  subtext: page.value?.fincobiz?.subtext ?? t('home.fincobiz.subtext'),
}))

type CardId = 'eligibility' | 'receivables' | 'request'

const cards = [
  { id: 'eligibility' as CardId, dot: '#12b76a', bar: '#12b76a', img: 3, art: '61.67%', w: 1421 },
  { id: 'receivables' as CardId, dot: '#4e83fd', bar: '#4e83fd', img: 1, art: '58.81%', w: 1355 },
  { id: 'request' as CardId, dot: '#f7b23b', bar: '#f7b23b', img: 2, art: '60.76%', w: 1400 },
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
// read the peeked card.
//
// It also only runs while the deck is on screen in a foregrounded tab — matching
// the three real carousels (HomeProducts / HomeNews / Branches), which have had
// both gates all along. This one had neither, despite the comment here claiming
// it "stops entirely off-screen": there was no observer, so the deck kept
// re-ordering (and re-rendering three transformed cards) every 5s for the whole
// page lifetime, wherever the visitor was and whether or not the tab was even
// in front.
//
// Skipped for prefers-reduced-motion, same as those three. The stylesheet below
// already cuts `.biz-card`'s transition to 0.01ms for that preference, but nothing
// stopped the timer driving it — so a reduced-motion visitor got the deck HARD
// CUTTING to a new order every 5s instead of sliding, which is the unprompted
// movement the preference exists to prevent, just delivered as a jump. The 0.01ms
// rule deliberately stays: a card promoted by an actual CLICK should respond
// instantly, and that motion is user-initiated.
const AUTO_MS = 5000
let timer: ReturnType<typeof setInterval> | null = null
let autoObserver: IntersectionObserver | null = null
let hovering = false
let onScreen = false

const rootEl = ref<HTMLElement | null>(null)

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
  if (!onScreen || hovering || document.hidden) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(advance, AUTO_MS)
}
function onEnter() {
  hovering = true
  stopAuto()
}
function onLeave() {
  hovering = false
  startAuto()
}
function onVisibility() {
  if (document.hidden) stopAuto()
  else startAuto()
}
function onPromote(id: CardId) {
  promote(id)
  startAuto()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  if (!('IntersectionObserver' in window)) {
    // No IO to gate on — fall back to always-on rather than never-on.
    onScreen = true
    startAuto()
    return
  }
  autoObserver = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1]?.isIntersecting ?? false
    if (onScreen) startAuto()
    else stopAuto()
  }, { threshold: 0.2 })
  if (rootEl.value) autoObserver.observe(rootEl.value)
})

onBeforeUnmount(() => {
  autoObserver?.disconnect()
  autoObserver = null
  stopAuto()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <section ref="rootEl" class="relative overflow-hidden bg-white py-24 lg:py-28 lg:pb-[80px]">
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
          <div
            class="biz-stack relative pt-[max(8cqw,88px)]"
            @pointerenter="onEnter"
            @pointerleave="onLeave"
          >
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

                <div class="relative flex min-h-0 flex-1 flex-col lg:block">
                  <div
                    class="relative z-10 flex flex-col gap-4 p-5 lg:absolute lg:left-[4.6875%] lg:top-1/2 lg:h-[300px] lg:w-[34.72%] lg:-translate-y-1/2 lg:justify-between lg:gap-0 lg:p-0"
                  >
                    <div class="flex flex-col gap-3 lg:gap-4">
                      <div class="flex items-start gap-[18px] lg:gap-[22px]">
                        <span
                          aria-hidden="true"
                          class="w-1 shrink-0 self-stretch rounded-full"
                          :style="{ background: card.bar }"
                        />
                        <h3
                          class="font-display text-xl font-bold leading-7 text-[#212947] lg:text-[20px] lg:leading-[]"
                        >
                          {{ cardCopy(card.id).heading }}
                        </h3>
                      </div>
                      <p
                        class="text-sm font-extralight leading-[22px] text-black/60 lg:text-[18px] lg:leading-6 lg:tracking-[0.18px]"
                      >
                        {{ cardCopy(card.id).body }}
                      </p>
                    </div>

                    <AppButton
                      to="https://biz.finco.mn?utm_source=finco_home&utm_medium=card"
                      target="_blank"
                      variant="ghost"
                      arrow
                      class="h-10 self-start text-foreground"
                      :class="depth(card.id) === 0 ? '' : 'pointer-events-none'"
                    >
                      {{ t('common.learnMore') }}
                    </AppButton>
                  </div>

                  <NuxtImg
                    :src="`/images/home/fincobiz-${card.img}.png`"
                    alt=""
                    aria-hidden="true"
                    :width="card.w"
                    :height="794"
                    sizes="100vw lg:720px"
                    class="mt-auto block w-full object-cover object-right lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-full -mr-px"
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
.biz-stack {
  --peek: max(4cqw, 44px);
}

.biz-card {
  transform: translateY(calc(var(--depth) * var(--peek) * -1)) scale(calc(1 - var(--depth) * 0.04));
  transform-origin: top center;
  /* box-shadow:
    0 1px 2px rgba(23, 16, 84, 0.05),
    0 10px 22px -8px rgba(23, 16, 84, 0.16),
    0 34px 64px -26px rgba(23, 16, 84, 0.28); */
  transition:
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.6s ease,
    filter 0.6s ease;
}
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
