<script setup lang="ts">
// Home hero — Figma `Frame 2121453817` (node 1:11546).
//
// A centred rounded-40 card on a near-white section. The card is a CAROUSEL of
// four slides (one per product/service); each slide has its own full-bleed photo
// (dark bottom→top gradient for legibility), product wordmark/eyebrow, headline,
// subtext and a lime CTA. A four-tab switcher overlaps the card bottom; the active
// tab's top line doubles as an auto-advance PROGRESS bar (teal, fills over the slide
// duration then advances). Below the card, an infinite partner-logo marquee.
//
// Only the BeepWallet slide is fully designed in Figma; FincoBiz / Зээл / Итгэлцэл
// reuse their product/service page photos + copy (sourced from i18n), flagged here.
//
// Header note: this design ships a SOLID white header (not the transparent overlay
// the old dark hero used), so index.vue no longer sets `transparentHeader`.
import beepWordmark from '~/assets/icons/beep-wordmark-white.svg?url'

const { t } = useI18n()
const localePath = useLocalePath()
// (carousel + marquee below)

// Partner logos exported from Figma as white SVGs (muted to grey via mix-blend on
// the light strip). Keyed by filename so the ordered list below resolves to URLs.
const partnerUrls = import.meta.glob('../assets/icons/partners/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
function partnerSrc(name: string) {
  const hit = Object.entries(partnerUrls).find(([p]) => p.endsWith(`/${name}.svg`))
  return hit?.[1] ?? ''
}
// name + intrinsic height (px) per Figma `Item → <name>` sizes; width auto-scales.
const partners = [
  { name: 'fortis', h: 32 }, { name: 'usbc', h: 28 }, { name: 'uphold', h: 32 },
  { name: 'clara', h: 20 }, { name: 'super', h: 22 }, { name: 'happymoney', h: 24 },
  { name: 'moneygram', h: 32 }, { name: 'nuvei', h: 24 }, { name: 'sofi', h: 28 },
  { name: 'dlocal', h: 24 }, { name: 'dave', h: 22 }, { name: 'balance', h: 24 },
  { name: 'curve', h: 24 }, { name: 'coinflow', h: 28 }, { name: 'cashco', h: 24 },
  { name: 'barte', h: 32 }, { name: 'taskrabbit', h: 22 }, { name: 'airbase', h: 24 },
] as const

// Carousel slides — order matches the tab bar (left→right). `logo` only for the
// designed BeepWallet slide; the others show an eyebrow text label instead.
const slides = [
  { key: 'fincoBiz', to: '/business', bg: '/images/products/hero-business.jpg' },
  { key: 'beepWallet', to: '/products', bg: '/images/home/hero-beep-bg.jpg', logo: beepWordmark },
  { key: 'loans', to: '/products', bg: '/images/products/hero-individual.jpg' },
  { key: 'trust', to: '/services', bg: '/images/services/itgeltsel-hero.jpg' },
] as const

const SLIDE_MS = 6000
const current = ref(0) // start on the first tab (FincoBiz); cycles in tab order
const reduced = ref(false)
const mounted = ref(false)

function go(i: number) {
  current.value = (i + slides.length) % slides.length
}
function next() {
  if (!reduced.value) go(current.value + 1)
}

// Pause on hover/focus is handled purely in CSS (`.hero-card:hover` /
// `:focus-within` pause the progress animation) — the browser pairs enter/leave
// reliably, so the auto-advance can never get stuck the way a JS flag can.

// Touch / pointer swipe on the card.
let startX = 0
let swiping = false
function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('a,button')) return
  swiping = true
  startX = e.clientX
}
function onPointerUp(e: PointerEvent) {
  if (!swiping) return
  swiping = false
  const dx = e.clientX - startX
  if (Math.abs(dx) > 50) go(current.value + (dx < 0 ? 1 : -1))
}

// Roving arrow-key navigation across the tablist.
function onTabKey(e: KeyboardEvent, i: number) {
  if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); focusTab(current.value) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); focusTab(current.value) }
  else if (e.key === 'Home') { e.preventDefault(); go(0); focusTab(0) }
  else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); focusTab(slides.length - 1) }
}
const tabRefs = ref<HTMLButtonElement[]>([])
function focusTab(i: number) {
  nextTick(() => tabRefs.value[i]?.focus())
}

onMounted(() => {
  mounted.value = true
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches
  mq.addEventListener('change', (e) => { reduced.value = e.matches })
})
</script>

<template>
  <section class="bg-[#fcfcff] pt-5 pb-5 sm:pt-6 lg:pt-7">
    <div class="mx-auto max-w-[1512px] px-4 sm:px-6 lg:px-9">
      <!-- ── Hero card / carousel ───────────────────────────────────────── -->
      <div
        class="hero-card relative isolate mx-auto h-[540px] max-w-[1440px] overflow-clip rounded-[28px] bg-white text-white sm:h-[640px] sm:rounded-[40px] lg:h-[737px]"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="swiping = false"
      >
        <!-- Stacked backgrounds, cross-faded -->
        <div aria-hidden="true" class="absolute inset-0 -z-10">
          <NuxtImg
            v-for="(s, i) in slides"
            :key="s.key"
            :src="s.bg"
            alt=""
            width="1440"
            height="737"
            :fetchpriority="i === current ? 'high' : 'auto'"
            class="absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none"
            :class="i === current ? 'opacity-100' : 'opacity-0'"
          />
          <!-- Legibility gradient: Figma's dark bottom → transparent (~97%), plus a
               softer left→right wash so the centred copy stays readable across all
               four slide photos (the reused photos are brighter than BeepWallet's). -->
          <div
            class="absolute inset-0"
            style="background: linear-gradient(to top, rgba(0,0,0,0.71) 0%, rgba(0,0,0,0) 96.8%), linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%);"
          />
        </div>

        <!-- Slide copy. A single keyed <Motion> remounts on slide change so the copy
             always matches the active tab/bg (no exit-lag). `:initial` is disabled
             until mounted, so the SSR/first paint renders visible (motion-v enter
             animations strand server-hydrated nodes at opacity:0 otherwise). -->
        <div class="absolute inset-0 flex items-center">
          <div class="mx-auto w-full max-w-[1200px] px-6 lg:px-0">
            <Motion
                :key="slides[current].key"
                role="tabpanel"
                :id="`hero-panel-${slides[current].key}`"
                :aria-labelledby="`hero-tab-${slides[current].key}`"
                :initial="mounted ? { opacity: 0, y: 16 } : false"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }"
                class="flex max-w-[640px] flex-col gap-8 lg:gap-10"
              >
                <div class="flex flex-col gap-5 lg:gap-6">
                  <!-- Wordmark (designed slide) or eyebrow label -->
                  <img
                    v-if="'logo' in slides[current] && slides[current].logo"
                    :src="(slides[current] as { logo: string }).logo"
                    :alt="t('hero.wordmarkAlt')"
                    width="109"
                    height="40"
                    class="h-9 w-auto self-start sm:h-10"
                  >
                  <span
                    v-else
                    class="font-display text-lg font-semibold tracking-tight text-white/95 sm:text-xl"
                  >
                    {{ t(`hero.tabs.${slides[current].key}`) }}
                  </span>

                  <h1 class="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.25rem] sm:leading-[1.18] lg:text-[2.5rem] lg:leading-[3rem]">
                    {{ t(`hero.slides.${slides[current].key}.headline`) }}
                  </h1>

                  <p class="max-w-[620px] text-base font-light leading-7 text-white/90 sm:text-lg lg:text-xl lg:leading-8">
                    {{ t(`hero.slides.${slides[current].key}.subtext`) }}
                  </p>
                </div>

                <NuxtLink
                  :to="localePath(slides[current].to)"
                  class="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2 text-sm font-medium text-dark shadow-2xs transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
                >
                  {{ t('hero.cta') }}
                  <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M3.33 8h9.34M9 4.33 12.67 8 9 11.67" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </NuxtLink>
            </Motion>
          </div>
        </div>

        <!-- ── Tab switcher (overlaps card bottom) ───────────────────────── -->
        <div
          role="tablist"
          :aria-label="t('hero.carouselLabel')"
          class="absolute inset-x-0 bottom-0 lg:bottom-9"
        >
          <ul class="mx-auto flex w-full max-w-[1200px] gap-4 overflow-x-auto px-6 pb-6 lg:justify-between lg:gap-0 lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li
              v-for="(s, i) in slides"
              :key="s.key"
              class="w-40 shrink-0 lg:w-[240px]"
            >
              <button
                :ref="(el) => { if (el) tabRefs[i] = el as HTMLButtonElement }"
                type="button"
                role="tab"
                :id="`hero-tab-${s.key}`"
                :aria-selected="i === current"
                :aria-controls="`hero-panel-${s.key}`"
                :tabindex="i === current ? 0 : -1"
                class="flex w-full flex-col gap-4 pt-2 pb-6 text-left outline-none lg:pb-0"
                @click="go(i)"
                @keydown="onTabKey($event, i)"
              >
                <!-- Top line: track + (active) animated teal progress fill -->
                <span class="relative block h-0.5 w-full overflow-hidden bg-white/20">
                  <span
                    v-if="i === current"
                    :key="`prog-${current}-${reduced}`"
                    class="absolute inset-0 origin-left bg-teal"
                    :class="reduced ? 'scale-x-100' : 'hero-progress'"
                    :style="reduced ? undefined : { animationDuration: `${SLIDE_MS}ms` }"
                    @animationend="next"
                  />
                </span>
                <span
                  class="truncate text-base leading-5 transition-colors"
                  :class="i === current ? 'font-medium text-white' : 'font-normal text-white/80'"
                >
                  {{ t(`hero.tabs.${s.key}`) }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- ── Partner-logo marquee ──────────────────────────────────────── -->
      <div
        class="marquee relative mt-5 flex h-[101px] items-center overflow-hidden"
        role="group"
        :aria-label="t('hero.marqueeLabel')"
      >
        <div class="marquee-track flex w-max shrink-0 items-center gap-12 pr-12 sm:gap-14 sm:pr-14">
          <img
            v-for="(p, i) in [...partners, ...partners]"
            :key="`${p.name}-${i}`"
            :src="partnerSrc(p.name)"
            :alt="i < partners.length ? p.name : ''"
            :aria-hidden="i >= partners.length ? 'true' : undefined"
            :style="{ height: `${p.h}px` }"
            class="w-auto shrink-0 object-contain opacity-50 [filter:brightness(0)]"
            loading="lazy"
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Active-tab progress bar: fills left→right over the slide duration, then its
   animationend advances the carousel. Pause via inline animation-play-state. */
.hero-progress {
  transform: scaleX(0);
  animation-name: hero-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes hero-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* Pause auto-advance while hovering, or while a control is KEYBOARD-focused
   (`:focus-visible`, not plain `:focus`) — so clicking a tab doesn't leave the
   bar stuck-paused on the now-focused button. Browser-managed, so resume is
   guaranteed the moment the pointer/keyboard focus leaves. */
.hero-card:hover .hero-progress {
  animation-play-state: paused;
}
/* Separate rule: if a browser lacks :has(), only this rule is dropped — hover
   pause above still works. :focus-visible (not :focus) so a mouse CLICK on a tab
   doesn't leave the bar paused on the now-focused button. */
.hero-card:has(:focus-visible) .hero-progress {
  animation-play-state: paused;
}

/* Seamless infinite marquee: the track holds two copies; translating it -50%
   lands copy #2 exactly where copy #1 began. */
.marquee-track {
  animation: marquee 45s linear infinite;
}
.marquee:hover .marquee-track {
  animation-play-state: paused;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
    row-gap: 1rem;
  }
  .hero-progress {
    animation: none;
  }
}
</style>
