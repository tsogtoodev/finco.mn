<script setup lang="ts">
import type { Collections } from '@nuxt/content'
// AutoNextNews — Figma 663:14382 (pill 663:14469 + card 663:14459 + blur band
// 663:14450). Fixed bottom overlay for the news detail page: when the reader
// nears the end of an article it offers the NEXT (next-oldest) article with an
// auto-advance countdown — the violet fill in the pill is the timer. "Хаах"
// dismisses it for this article, "Унших" navigates immediately.
//
// Self-gating: renders nothing unless the current route is a news detail page
// with a next article to offer, so it can be mounted unconditionally in the
// default layout (planned wiring; not mounted anywhere yet).
//
// Auto-advance rules: the countdown ticks only while the reader stays in the
// end zone of the page and the tab is visible; scrolling back up pauses it.
// Under prefers-reduced-motion the countdown never runs — the card still
// appears, navigation is manual only.
import hourglassIcon from '~/assets/icons/hourglass-end.svg?url'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const provider = useCmsProvider()

// i18n route names look like `news-slug___mn`
const isNewsDetail = computed(() => String(route.name ?? '').startsWith('news-slug'))
const currentSlug = computed(() => (isNewsDetail.value ? String(route.params.slug ?? '') : ''))

// Newest-first article list (same source as HomeNews / the news index), used
// to find the article that follows the one being read.
const { data: articles } = await useAsyncData(
  () => `news-autonext-${locale.value}`,
  () =>
    provider === 'directus'
      ? fetchCms<Collections['news'][]>('news', { locale: locale.value })
      : queryCollection('news')
          .where('locale', '=', locale.value)
          .order('publishedAt', 'DESC')
          .all(),
  { watch: [locale], default: () => [] },
)

const next = computed(() => {
  if (!currentSlug.value) return null
  const list = articles.value ?? []
  const idx = list.findIndex((n) => n.slug === currentSlug.value)
  if (idx === -1) return null
  // external-link articles (`to`) can't be "read next" in place — skip them
  return list.slice(idx + 1).find((n) => !n.to) ?? null
})

// ── visibility + countdown ──────────────────────────────────────────────────
const DURATION_MS = 10000
const TICK_MS = 100
const END_ZONE_PX = 300 // "near the end" = within this of the document bottom

const visible = ref(false) // flips once the reader first reaches the end zone
const closed = ref(false) // per-article dismiss ("Хаах")
const progress = ref(0) // 0..1 countdown
const reduced = ref(false)
let inEndZone = false
let timer: ReturnType<typeof setInterval> | null = null
let navigating = false

const show = computed(() => isNewsDetail.value && !!next.value && visible.value && !closed.value)

function onScroll() {
  const doc = document.documentElement
  inEndZone = window.scrollY + window.innerHeight >= doc.scrollHeight - END_ZONE_PX
  if (inEndZone && !visible.value) visible.value = true
}

function tick() {
  // pause while scrolled back up, tab hidden, or dismissed
  if (!show.value || !inEndZone || document.hidden || reduced.value) return
  progress.value = Math.min(1, progress.value + TICK_MS / DURATION_MS)
  if (progress.value >= 1 && next.value && !navigating) {
    navigating = true
    navigateTo(localePath(`/news/${next.value.slug}`))
  }
}

// new article (or leaving news): reset the whole cycle
watch(() => route.fullPath, () => {
  visible.value = false
  closed.value = false
  progress.value = 0
  navigating = false
  inEndZone = false
})

onMounted(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches
  mq.addEventListener('change', (e) => { reduced.value = e.matches })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
  timer = setInterval(tick, TICK_MS)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div
    v-if="show && next"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-40"
  >
    <!-- Blurred white fade band behind the pill + card (Figma 663:14450) -->
    <div
      aria-hidden="true"
      class="absolute inset-x-0 bottom-0 h-[285px] backdrop-blur-[2px]"
      style="
        background: linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 100%);
        -webkit-mask-image: linear-gradient(to top, #000 60%, transparent 100%);
        mask-image: linear-gradient(to top, #000 60%, transparent 100%);
      "
    />

    <div class="auto-next-pop relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-[18px] px-4 pb-8">
      <!-- Countdown pill: the violet fill is the auto-advance timer -->
      <div
        class="pointer-events-auto relative flex items-center gap-3 overflow-clip rounded-full bg-white px-4 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          class="absolute inset-y-0 left-0 bg-[#5D54EC]/20 transition-[width] duration-150 ease-linear"
          :style="{ width: `${progress * 100}%` }"
        />
        <img :src="hourglassIcon" alt="" width="17" height="24" class="relative h-6 w-auto">
        <span class="relative truncate text-sm font-light leading-6 text-black/60">
          {{ t('newsPage.autoNextHint') }}
        </span>
      </div>

      <!-- Next-article card -->
      <div class="pointer-events-auto flex w-fit max-w-full items-center gap-4 rounded-2xl bg-white p-4 drop-shadow-[0_0_5px_rgba(0,0,0,0.1)] sm:gap-[26px]">
        <div class="flex min-w-0 items-center gap-3 sm:w-[412px]">
          <div class="hidden h-[77px] w-[120px] shrink-0 overflow-clip rounded-xl bg-[#f5f5f5] sm:block">
            <NuxtImg
              v-if="next.image"
              :src="next.image"
              :alt="next.title"
              width="120"
              height="77"
              sizes="120px"
              class="size-full object-cover"
            />
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <p class="line-clamp-2 text-base font-medium leading-snug text-black/70">{{ next.title }}</p>
            <p v-if="next.summary" class="truncate text-base font-extralight leading-6 text-black/60">
              {{ next.summary }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-4">
          <button
            type="button"
            class="hidden h-12 items-center justify-center rounded-3xl bg-[#f5f5f5] px-6 text-base font-medium text-[#171717] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 sm:inline-flex cursor-pointer"
            @click="closed = true"
          >
            {{ t('newsPage.autoNextClose') }}
          </button>
          <NuxtLink
            :to="localePath(`/news/${next.slug}`)"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-3xl bg-accent px-6 text-base font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {{ t('newsPage.autoNextRead') }}
            <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M3.33 8h9.34M9 4.33 12.67 8 9 11.67" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Rise-in on first reveal. Plain CSS (not Vue Transition) so the SSR-less
   overlay can't strand mid-enter — same reasoning as the mega-menu pop. */
.auto-next-pop {
  animation: auto-next-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes auto-next-pop {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .auto-next-pop {
    animation: none;
  }
}
</style>
