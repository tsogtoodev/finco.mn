<script setup lang="ts">
import beepWordmark from '~/assets/icons/beep-wordmark-white.svg?url'
import fincoBizLogo from '~/assets/icons/fincobiz-logo-white.svg?url'

const { t } = useI18n()

const page = await usePageContent('home')
function slideDoc(key: string) {
  return page.value?.heroSlides?.find((s) => s.key === key)
}
function slideCopy(key: string) {
  const doc = slideDoc(key)
  return {
    tab: doc?.tab ?? t(`hero.tabs.${key}`),
    headline: doc?.headline ?? t(`hero.slides.${key}.headline`),
    subtext: doc?.subtext ?? t(`hero.slides.${key}.subtext`),
  }
}

const partnerUrls = import.meta.glob('../assets/icons/partners/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
function partnerSrc(name: string) {
  const hit = Object.entries(partnerUrls).find(([p]) => p.endsWith(`/${name}.svg`))
  return hit?.[1] ?? ''
}
const partners = [
  { name: 'fortis', h: 32 }, { name: 'usbc', h: 28 }, { name: 'uphold', h: 32 },
  { name: 'clara', h: 20 }, { name: 'super', h: 22 }, { name: 'happymoney', h: 24 },
  { name: 'moneygram', h: 32 }, { name: 'nuvei', h: 24 }, { name: 'sofi', h: 28 },
  { name: 'dlocal', h: 24 }, { name: 'dave', h: 22 }, { name: 'balance', h: 24 },
  { name: 'curve', h: 24 }, { name: 'coinflow', h: 28 }, { name: 'cashco', h: 24 },
  { name: 'barte', h: 32 }, { name: 'taskrabbit', h: 22 }, { name: 'airbase', h: 24 },
] as const

const slides = [
  { key: 'fincoBiz', to: '/business', bg: '/images/products/hero-business.jpg', logo: fincoBizLogo },
  { key: 'beepWallet', to: '/products', bg: '/images/home/hero-beep-bg.jpg', logo: beepWordmark },
  { key: 'loans', to: '/products', bg: '/images/products/hero-individual.jpg' },
  { key: 'trust', to: '/services', bg: '/images/services/itgeltsel-hero.jpg' },
] as const

function slideBg(key: string, fallback: string) {
  return slideDoc(key)?.image || fallback
}

const SLIDE_MS = 6000
const current = ref(0)
const reduced = ref(false)

const isBeepSlide = computed(() => slides[current.value].key === 'beepWallet')

function go(i: number) {
  current.value = (i + slides.length) % slides.length
}
function next() {
  if (!reduced.value) go(current.value + 1)
}

const ctaReady = ref(false)
const textReveals = ref(0)
const textBlockCount = computed(() =>
  'logo' in slides[current.value] && (slides[current.value] as { logo?: string }).logo ? 2 : 3,
)
let ctaFallback: ReturnType<typeof setTimeout> | undefined
function armCtaFallback() {
  if (ctaFallback) clearTimeout(ctaFallback)
  ctaFallback = setTimeout(() => { ctaReady.value = true }, 1600)
}
function onTextReveal() {
  if (++textReveals.value >= textBlockCount.value) ctaReady.value = true
}
watch(current, () => {
  textReveals.value = 0
  ctaReady.value = false
  armCtaFallback()
})

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

const p = ref(0)
const settledW = ref(1440)
const scrub = ref(false)
const DESKTOP = '(min-width: 1024px)'
const RUNWAY_VH = 0.8

function computeP() {
  if (typeof window === 'undefined') return
  settledW.value = Math.round(window.innerWidth * 0.9)
  const runway = window.innerHeight * RUNWAY_VH
  p.value = runway > 0 ? Math.min(1, Math.max(0, window.scrollY / runway)) : 1
}
const scrubScroll = useScrollSync(computeP)

function setupScrub() {
  const on = !reduced.value && window.matchMedia(DESKTOP).matches
  if (on === scrub.value) { if (on) computeP(); return }
  scrub.value = on
  if (on) {
    scrubScroll.start()
    computeP()
  }
  else {
    scrubScroll.stop()
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
  if (ctaFallback) clearTimeout(ctaFallback)
})
</script>

<template>
  <section class="bg-[#fcfcff] motion-safe:lg:h-[calc(80vh+856px)]">
    <div
      class="hero-pin px-0 pt-0 lg:px-9 lg:pt-7 motion-safe:lg:sticky motion-safe:lg:top-0 motion-safe:lg:!px-0"
      :style="{ '--hero-p': p, '--hero-settled-w': `${settledW}px` }"
    >
      <div
        class="hero-card is-scrub relative isolate mx-auto h-[calc(100svh-var(--announcement-h,0px))] w-full max-w-none overflow-clip rounded-none bg-white text-white lg:h-[737px] lg:max-w-[1440px] lg:rounded-[40px]"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="swiping = false"
      >
        <div aria-hidden="true" class="absolute inset-0 -z-10">
          <NuxtImg
            v-for="(s, i) in slides"
            :key="s.key"
            :src="slideBg(s.key, s.bg)"
            alt=""
            width="1440"
            height="737"
            :preload="i === 0"
            :fetchpriority="i === current ? 'high' : 'auto'"
            class="absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none"
            :class="i === current ? 'opacity-100' : 'opacity-0'"
          />
          <div
            class="absolute inset-0"
            style="background: linear-gradient(to top, rgba(0,0,0,0.71) 0%, rgba(0,0,0,0) 96.8%), linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%);"
          />
        </div>

        <div class="absolute inset-0 flex items-center">
          <div class="mx-auto w-full max-w-[1200px] px-6 lg:px-[2%]">
            <div
                :key="slides[current].key"
                role="tabpanel"
                :id="`hero-panel-${slides[current].key}`"
                :aria-labelledby="`hero-tab-${slides[current].key}`"
                class="flex max-w-[640px] flex-col gap-8 lg:gap-10"
              >
                <div class="flex flex-col gap-2 lg:gap-4">
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
                    class="font-display text-lg font-semibold tracking-tight text-white/95 sm:text-[24px] mb-4"
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
                    class="max-w-[620px] text-base font-extralight leading-7 text-white/80 sm:text-lg lg:text-[18px] lg:leading-[24px]"
                    @animation-complete="onTextReveal"
                  />
                </div>

                <Motion
                  class="w-fit"
                  :initial="{ opacity: 0, y: -16, filter: 'blur(6px)' }"
                  :animate="ctaReady ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: -16, filter: 'blur(6px)' }"
                  :transition="{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }"
                >
                  <AppButton
                    :to="slides[current].to"
                    :variant="isBeepSlide ? 'lime' : 'accent'"
                    arrow
                    class="h-10 w-fit shadow-2xs"
                    :class="isBeepSlide ? 'focus-visible:outline-lime' : 'focus-visible:outline-accent'"
                  >
                    {{ t('hero.cta') }}
                  </AppButton>
                </Motion>
            </div>
          </div>
        </div>

        <div class="hero-tabs absolute inset-x-0 bottom-0 lg:bottom-9">
          <ul
            role="tablist"
            :aria-label="t('hero.carouselLabel')"
            class="mx-auto hidden w-full max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] gap-4 overflow-x-auto px-[2%] pb-6 lg:flex lg:justify-between lg:gap-0 lg:px-[2%] lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
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

          <div class="mx-auto w-full max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] px-[2%] pb-10 lg:hidden" aria-hidden="true">
            <span class="relative block h-0.5 w-[40vw] overflow-hidden bg-white/20">
              <span
                :key="`m-prog-${current}-${reduced}`"
                class="absolute inset-0 origin-left"
                :class="[
                  isBeepSlide ? 'bg-lime' : 'bg-teal',
                  reduced ? 'scale-x-100' : 'hero-progress',
                ]"
                :style="reduced ? undefined : { animationDuration: `${SLIDE_MS}ms` }"
                @animationend="next"
              />
            </span>
          </div>
        </div>
      </div>

      <div class="pt-0 pb-5 sm:pb-6 lg:pb-7">
        <div class="mx-auto max-w-[1512px] px-4 sm:px-6 lg:px-9 pt-8">
          <div
            class="marquee relative flex h-[56px] items-center overflow-hidden"
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
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .hero-pin {
    padding-top: calc(28px * var(--hero-p, 0));
  }
  .hero-card.is-scrub {
    max-width: none;
    width: calc(100% - (100% - var(--hero-settled-w, 1368px)) * var(--hero-p, 0));
    height: calc((100vh - var(--announcement-h, 0px)) - ((100vh - var(--announcement-h, 0px)) - 737px) * var(--hero-p, 0));
    border-radius: calc(40px * var(--hero-p, 0));
    will-change: width, height;
  }
}

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

@media (min-width: 1024px) {
  .hero-tabs:hover .hero-progress {
    animation-play-state: paused;
  }
  .hero-tabs:has(:focus-visible) .hero-progress {
    animation-play-state: paused;
  }
}

.marquee {
  --marquee-fade: 40px;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--marquee-fade), #000 calc(100% - var(--marquee-fade)), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 var(--marquee-fade), #000 calc(100% - var(--marquee-fade)), transparent 100%);
}
@media (min-width: 640px) {
  .marquee { --marquee-fade: 96px; }
}

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
