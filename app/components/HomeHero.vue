<script setup lang="ts">
// Home hero — Figma `Frame 2121453817` (node 1:11546).
//
// A centred rounded-40 card on a near-white section. The card is a CAROUSEL of
// four slides (one per product/service); each slide has its own full-bleed photo
// (dark bottom→top gradient for legibility), product wordmark/eyebrow, headline,
// subtext and a CTA (lime on the BeepWallet slide, blurple accent on the others). A
// four-tab switcher overlaps the card bottom; the active tab's top line doubles as an
// auto-advance PROGRESS bar (lime on Beep matching its CTA, teal otherwise; fills
// over the slide duration then advances).
// Below the card, an infinite partner-logo marquee.
//
// Only the BeepWallet slide is fully designed in Figma; FincoBiz / Зээл / Итгэлцэл
// reuse their product/service page photos + copy (sourced from i18n), flagged here.
//
// Header note: the full-bleed dark slides sit under the transparent overlay nav
// (white logo/links + scrim), so index.vue sets `transparentHeader: true`.
import beepWordmark from '~/assets/icons/beep-wordmark-white.svg?url'

const { t } = useI18n()
const localePath = useLocalePath()

// Slide copy comes from the `pages` home doc (heroSlides, matched by slide
// key) so editors manage it in /content; i18n remains the fallback.
const page = await usePageContent('home')
function slideCopy(key: string) {
  const doc = page.value?.heroSlides?.find((s) => s.key === key)
  return {
    tab: doc?.tab ?? t(`hero.tabs.${key}`),
    headline: doc?.headline ?? t(`hero.slides.${key}.headline`),
    subtext: doc?.subtext ?? t(`hero.slides.${key}.subtext`),
  }
}
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

// CTA colour: only BeepWallet keeps its lime brand accent; every other slide
// (FincoBiz / Зээл / Итгэлцэл) uses the blurple accent.
const isBeepSlide = computed(() => slides[current.value].key === 'beepWallet')

function go(i: number) {
  current.value = (i + slides.length) % slides.length
}
function next() {
  if (!reduced.value) go(current.value + 1)
}

// ── CTA gating ────────────────────────────────────────────────────────────
// The CTA holds until EVERY text block on the slide has finished its
// BlurText reveal, then rises in. We count each eyebrow/headline/subtext
// `@animation-complete` against the slide's text-block count — the designed
// BeepWallet slide shows a wordmark <img> (not a text eyebrow) so it has 2 text
// blocks, the others 3. A short delay before the CTA gives it visual separation.
// (The last block to finish isn't always the subtitle: a long headline at 60ms/
// word can outlast a short subtitle at 35ms/word — hence counting, not one event.)
const ctaReady = ref(false)
const textReveals = ref(0)
const textBlockCount = computed(() =>
  'logo' in slides[current.value] && (slides[current.value] as { logo?: string }).logo ? 2 : 3,
)
// Safety net: reveal the CTA even if a completion event is ever missed (e.g. the
// hero somehow never enters view) so the primary CTA can't get stuck hidden.
let ctaFallback: ReturnType<typeof setTimeout> | undefined
function armCtaFallback() {
  if (ctaFallback) clearTimeout(ctaFallback)
  ctaFallback = setTimeout(() => { ctaReady.value = true }, 1600)
}
function onTextReveal() {
  if (++textReveals.value >= textBlockCount.value) ctaReady.value = true
}
// Each slide replays: reset the count + hide the CTA until the new copy lands.
watch(current, () => {
  textReveals.value = 0
  ctaReady.value = false
  armCtaFallback()
})

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

// ── Fullscreen-on-top scrub (desktop only) ───────────────────────────────
// At the top of the page the hero card fills the viewport; as the user scrolls
// it morphs into the settled card. The hero section reserves a runway (`180vh`,
// see template) so the card can stay PINNED while it shrinks, then releases —
// avoiding the layout jump a normal-flow resize would cause.
//
// `p` is the scrub progress: 0 = fullscreen (default — so SSR/first paint renders
// fullscreen, no flash), 1 = settled card. It drives the `--hero-p` CSS var the
// card interpolates off. The fullscreen LAYOUT (runway, sticky, fullscreen card) is
// CSS-gated via `motion-safe:lg` + the `.is-scrub` media query — present from the
// first paint. `scrub` here only gates the JS that updates `p` on scroll, so mobile
// / reduced-motion skip the scroll work and keep the plain static card.
const p = ref(0)
const settledW = ref(1440) // settled card width (px) — see computeP
const scrub = ref(false)
const DESKTOP = '(min-width: 1024px)'
// Scrub runway as a fraction of viewport height: p reaches 1 (settled) after the
// user scrolls 80vh. The section reserves 180vh (template) so the card stays
// pinned for the whole runway before releasing.
const RUNWAY_VH = 0.8

let rafId = 0
let scrollAttached = false
function computeP() {
  rafId = 0
  if (typeof window === 'undefined') return
  // Settled width matches the non-scrub `lg` card: capped at 1440 with a 4.5rem
  // (lg:px-9) gutter. Computed in JS and fed to CSS as `--hero-settled-w` because
  // a `min()`-with-percentage inside the width calc's multiplied term mis-evaluates
  // to 0 in some engines — a fixed px reference there is reliable.
  settledW.value = Math.min(1440, window.innerWidth - 72)
  const runway = window.innerHeight * RUNWAY_VH
  p.value = runway > 0 ? Math.min(1, Math.max(0, window.scrollY / runway)) : 1
}
function onScroll() {
  if (!rafId) rafId = requestAnimationFrame(computeP)
}
function setupScrub() {
  const on = !reduced.value && window.matchMedia(DESKTOP).matches
  if (on === scrub.value) { if (on) computeP(); return }
  scrub.value = on
  if (on && !scrollAttached) {
    scrollAttached = true
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    computeP()
  }
  else if (!on && scrollAttached) {
    scrollAttached = false
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    p.value = 1
  }
}

onMounted(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches
  mq.addEventListener('change', (e) => { reduced.value = e.matches; setupScrub() })

  window.matchMedia(DESKTOP).addEventListener('change', setupScrub)
  setupScrub()

  armCtaFallback()
})

onBeforeUnmount(() => {
  if (scrollAttached) {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
  if (rafId) cancelAnimationFrame(rafId)
  if (ctaFallback) clearTimeout(ctaFallback)
})
</script>

<template>
  <!-- ── Hero card / carousel ─────────────────────────────────────────────
       Two-section layout: this first section reserves the scroll runway and
       pins the card while it scrubs (desktop scrub only — see `scrub`); the
       partner marquee lives in its own normal-flow section below. -->
  <section class="bg-[#fcfcff] motion-safe:lg:h-[180vh]">
    <div
      class="px-0 pt-0 lg:px-9 lg:pt-7 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:flex motion-safe:lg:h-[calc(100vh-var(--announcement-h,0px))] motion-safe:lg:items-center motion-safe:lg:justify-center motion-safe:lg:!px-0 motion-safe:lg:!pt-0"
    >
      <!-- Mobile + tablet (<lg) render the hero full-bleed at viewport height
           (h-[100svh], no inset/rounding/frame) so it mirrors the desktop scrub's
           EXPANDED state rather than the condensed card. Only at lg does it become
           the inset rounded card + scroll scrub (see .hero-card.is-scrub below). -->
      <div
        class="hero-card is-scrub relative isolate mx-auto h-[calc(100svh-var(--announcement-h,0px))] w-full max-w-none overflow-clip rounded-none bg-white text-white lg:h-[737px] lg:max-w-[1440px] lg:rounded-[40px]"
        :style="{ '--hero-p': p, '--hero-settled-w': `${settledW}px` }"
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

        <!-- Slide copy. The keyed wrapper remounts on slide change so the copy
             always matches the active tab/bg (no exit-lag) and the stagger replays. -->
        <div class="absolute inset-0 flex items-center">
          <div class="mx-auto w-full max-w-[1200px] px-6 lg:px-0">
            <!-- Slide copy staggers in via `.hero-rise` (SSR-safe CSS, reduced-motion
                 aware). The wrapper is keyed by slide so it remounts on every change,
                 replaying the stagger for the new copy. -->
            <div
                :key="slides[current].key"
                role="tabpanel"
                :id="`hero-panel-${slides[current].key}`"
                :aria-labelledby="`hero-tab-${slides[current].key}`"
                class="flex max-w-[640px] flex-col gap-8 lg:gap-10"
              >
                <div class="flex flex-col gap-2 lg:gap-2">
                  <!-- Wordmark (designed slide) or eyebrow label -->
                  <img
                    v-if="'logo' in slides[current] && slides[current].logo"
                    :src="(slides[current] as { logo: string }).logo"
                    :alt="t('hero.wordmarkAlt')"
                    width="109"
                    height="40"
                    class="hero-rise h-9 w-auto self-start sm:h-10 mb-4"
                    style="animation-delay: 0.04s"
                  >
                  <BlurText
                    v-else
                    :text="slideCopy(slides[current].key).tab"
                    as="span"
                    animate-by="words"
                    :delay="25"
                    :start-delay="0.03"
                    class="font-display text-lg font-semibold tracking-tight text-white/95 sm:text-xl mb-4"
                    @animation-complete="onTextReveal"
                  />

                  <BlurText
                    :text="slideCopy(slides[current].key).headline"
                    as="h1"
                    animate-by="words"
                    :delay="38"
                    :start-delay="0.09"
                    class="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.25rem] sm:leading-[1.18] lg:text-[2.5rem] lg:leading-[3rem]"
                    @animation-complete="onTextReveal"
                  />

                  <BlurText
                    :text="slideCopy(slides[current].key).subtext"
                    as="p"
                    animate-by="words"
                    :delay="20"
                    :start-delay="0.15"
                    class="max-w-[620px] text-base font-light leading-7 text-white/90 sm:text-lg lg:text-xl lg:leading-8"
                    @animation-complete="onTextReveal"
                  />
                </div>

                <!-- CTA holds until every text block has revealed (see `onTextReveal`),
                     then rises in — replacing the old fixed-delay `.hero-rise`. -->
                <Motion
                  class="w-fit"
                  :initial="{ opacity: 0, y: -16, filter: 'blur(6px)' }"
                  :animate="ctaReady ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: -16, filter: 'blur(6px)' }"
                  :transition="{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }"
                >
                  <NuxtLink
                    :to="localePath(slides[current].to)"
                    class="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-2xs transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    :class="isBeepSlide
                      ? 'bg-lime text-dark focus-visible:outline-lime'
                      : 'bg-accent text-white focus-visible:outline-accent'"
                  >
                    {{ t('hero.cta') }}
                    <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                      <path d="M3.33 8h9.34M9 4.33 12.67 8 9 11.67" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </NuxtLink>
                </Motion>
            </div>
          </div>
        </div>

        <!-- ── Tab switcher (overlaps card bottom) ───────────────────────── -->
        <div
          role="tablist"
          :aria-label="t('hero.carouselLabel')"
          class="hero-tabs absolute inset-x-0 bottom-0 lg:bottom-9"
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
                class="group flex w-full flex-col gap-4 pt-2 pb-6 text-left outline-none lg:pb-0 cursor-pointer"
                @click="go(i)"
                @keydown="onTabKey($event, i)"
              >
                <!-- Top line: track + (active) animated progress fill — lime on
                     BeepWallet (matching its CTA), teal on the other slides. -->
                <span class="relative block h-0.5 w-full overflow-hidden bg-white/20">
                  <span
                    v-if="i === current"
                    :key="`prog-${current}-${reduced}`"
                    class="absolute inset-0 origin-left"
                    :class="[
                      isBeepSlide ? 'bg-lime' : 'bg-teal',
                      reduced ? 'scale-x-100' : 'hero-progress',
                    ]"
                    :style="reduced ? undefined : { animationDuration: `${SLIDE_MS}ms` }"
                    @animationend="next"
                  />
                </span>
                <span
                  class="truncate text-base leading-5 transition-colors group-hover:text-white"
                  :class="i === current ? 'font-medium text-white' : 'font-normal text-white/80'"
                >
                  {{ slideCopy(s.key).tab }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Partner-logo marquee (own normal-flow section, below the pin) ───── -->
  <section class="bg-[#fcfcff] pt-0 pb-5 sm:pb-6 lg:pb-7">
    <div class="mx-auto max-w-[1512px] px-4 sm:px-6 lg:px-9">
      <div
        class="marquee relative flex h-[31px] items-center overflow-hidden"
        role="group"
        :aria-label="t('hero.marqueeLabel')"
      >
        <div class="marquee-track flex w-max shrink-0 items-center gap-12 pr-12 sm:gap-14 sm:pr-14">
          <img
            v-for="(partner, i) in [...partners, ...partners]"
            :key="`${partner.name}-${i}`"
            :src="partnerSrc(partner.name)"
            :alt="i < partners.length ? partner.name : ''"
            :aria-hidden="i >= partners.length ? 'true' : undefined"
            :style="{ height: `${partner.h}px` }"
            class="w-auto shrink-0 object-contain opacity-50 [filter:brightness(0)]"
            loading="lazy"
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Fullscreen-on-top scrub. The card interpolates from fullscreen (--hero-p:0) to
   the settled card (--hero-p:1). Gated by CSS — desktop + motion-ok — NOT by a JS
   class, so the very first SSR paint already renders fullscreen and there's no
   settled→fullscreen flash on refresh. `--hero-p` defaults to 0 (fullscreen) until
   JS drives it on scroll; mobile / reduced-motion keep the Tailwind sizing. 100%
   resolves against the pinned wrapper (full-bleed, h-screen) — avoids the 100vw
   horizontal-scrollbar gotcha. */
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .hero-card.is-scrub {
    max-width: none;
    width: calc(100% - (100% - var(--hero-settled-w, 1368px)) * var(--hero-p, 0));
    height: calc(100% - (100% - 737px) * var(--hero-p, 0));
    border-radius: calc(40px * var(--hero-p, 0));
    will-change: width, height;
  }
}

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

/* Pause auto-advance only while interacting with the carousel CONTROLS (the tab
   switcher) — hovering the rest of the card/section keeps it advancing. Also pause
   while a control is KEYBOARD-focused (`:focus-visible`, not plain `:focus`) — so
   clicking a tab doesn't leave the bar stuck-paused on the now-focused button.
   Browser-managed, so resume is guaranteed the moment hover/focus leaves. */
.hero-tabs:hover .hero-progress {
  animation-play-state: paused;
}
/* Separate rule: if a browser lacks :has(), only this rule is dropped — hover
   pause above still works. :focus-visible (not :focus) so a mouse CLICK on a tab
   doesn't leave the bar paused on the now-focused button. */
.hero-tabs:has(:focus-visible) .hero-progress {
  animation-play-state: paused;
}

/* Edge fade mask: logos dissolve into the section background at the left/right
   ends of the strip instead of hard-clipping at the overflow edge. Narrower fade
   on mobile, wider on ≥sm. Disabled under reduced-motion (the strip wraps to
   static centred rows, where an edge fade would clip logos oddly). */
.marquee {
  --marquee-fade: 40px;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--marquee-fade), #000 calc(100% - var(--marquee-fade)), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 var(--marquee-fade), #000 calc(100% - var(--marquee-fade)), transparent 100%);
}
@media (min-width: 640px) {
  .marquee { --marquee-fade: 96px; }
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
  .marquee {
    -webkit-mask-image: none;
            mask-image: none;
  }
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
