<script setup lang="ts">
import type { Collections } from '@nuxt/content'
import hourglassIcon from '~/assets/icons/hourglass-end.svg?url'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const provider = useCmsProvider()

const isNewsDetail = computed(() => String(route.name ?? '').startsWith('news-slug'))
const currentSlug = computed(() => (isNewsDetail.value ? String(route.params.slug ?? '') : ''))

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
  return [...list.slice(idx + 1), ...list.slice(0, idx)].find((n) => !n.to) ?? null
})

const DURATION_MS = 10000
const TICK_MS = 100
const END_ZONE_PX = 300

const isMobile = ref(false)

const visible = ref(false)
const closed = ref(false)
const closing = ref(false)
const progress = ref(0)
const reduced = ref(false)
const inEndZone = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let navigating = false

const show = computed(() => isNewsDetail.value && !isMobile.value && !!next.value && visible.value && !closed.value)

const open = ref(false)
const EXIT_MS = 420
let openTimer: ReturnType<typeof setTimeout> | null = null
watch(show, (shown) => {
  if (openTimer) clearTimeout(openTimer)
  if (shown) {
    open.value = false
    openTimer = setTimeout(() => { open.value = true }, 30)
  } else {
    open.value = false
  }
})

let closeTimer: ReturnType<typeof setTimeout> | null = null
function dismiss() {
  if (closing.value) return
  closing.value = true
  open.value = false
  closeTimer = setTimeout(() => {
    closed.value = true
    closing.value = false
  }, EXIT_MS)
}

const armed = ref(true)
let armTimer: ReturnType<typeof setTimeout> | null = null

function onScroll() {
  const doc = document.documentElement
  inEndZone.value = window.scrollY + window.innerHeight >= doc.scrollHeight - END_ZONE_PX
  if (!inEndZone.value) armed.value = true
  if (inEndZone.value && armed.value && !visible.value && !closing.value) visible.value = true
}

let hideTimer: ReturnType<typeof setTimeout> | null = null
watch(inEndZone, (inZone) => {
  if (inZone || !show.value || closing.value) return
  closing.value = true
  open.value = false
  hideTimer = setTimeout(() => {
    visible.value = false
    closing.value = false
    progress.value = 0
  }, EXIT_MS)
})

function startTicking() {
  stopTicking()
  if (document.hidden) return
  timer = setInterval(tick, TICK_MS)
}
function stopTicking() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function onVisibility() {
  if (document.hidden) stopTicking()
  else startTicking()
}

function tick() {
  if (!show.value || closing.value || !inEndZone.value || document.hidden || reduced.value) return
  progress.value = Math.min(1, progress.value + TICK_MS / DURATION_MS)
  if (progress.value >= 1 && next.value && !navigating) {
    navigating = true
    navigateTo(localePath(`/news/${next.value.slug}`))
  }
}

const unguard = router.beforeEach(() => {
  visible.value = false
  open.value = false
  closing.value = false
  armed.value = false
})

watch(() => route.fullPath, () => {
  visible.value = false
  closed.value = false
  closing.value = false
  if (closeTimer) clearTimeout(closeTimer)
  if (hideTimer) clearTimeout(hideTimer)
  progress.value = 0
  navigating = false
  inEndZone.value = false
  armed.value = false
  if (armTimer) clearTimeout(armTimer)
  armTimer = setTimeout(() => {
    armed.value = true
    onScroll()
  }, 800)
})

onMounted(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches
  mq.addEventListener('change', (e) => { reduced.value = e.matches })
  const mobileMq = window.matchMedia('(max-width: 639px)')
  isMobile.value = mobileMq.matches
  mobileMq.addEventListener('change', (e) => { isMobile.value = e.matches })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
  document.addEventListener('visibilitychange', onVisibility)
  startTicking()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  document.removeEventListener('visibilitychange', onVisibility)
  stopTicking()
  if (closeTimer) clearTimeout(closeTimer)
  if (hideTimer) clearTimeout(hideTimer)
  if (openTimer) clearTimeout(openTimer)
  if (armTimer) clearTimeout(armTimer)
  unguard()
})
</script>

<template>
  <div
    v-if="show && next"
    class="anx-overlay pointer-events-none fixed inset-x-0 bottom-0 z-40"
    :class="open ? 'anx-open' : ''"
  >
    <div
      aria-hidden="true"
      class="anx-backdrop absolute inset-x-0 bottom-0 h-[285px] backdrop-blur-[2px]"
      style="
        background: linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0) 100%);
        -webkit-mask-image: linear-gradient(to top, #000 60%, transparent 100%);
        mask-image: linear-gradient(to top, #000 60%, transparent 100%);
      "
    />

    <div class="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-[18px] px-4 pb-8">
      <div
        class="anx-pill pointer-events-auto relative flex items-center gap-3 overflow-clip rounded-full bg-white px-4 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
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

      <div class="anx-card pointer-events-auto flex w-fit max-w-full items-center gap-4 rounded-2xl bg-white p-4 drop-shadow-[0_0_5px_rgba(0,0,0,0.1)] sm:gap-[26px]">
        <div class="flex min-w-0 items-center gap-3 sm:w-[412px]">
          <div class="h-[77px] w-[120px] shrink-0 overflow-clip rounded-xl bg-[#f5f5f5]">
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
          <AppButton variant="secondary" size="lg" pill class="cursor-pointer" @click="dismiss">
            {{ t('newsPage.autoNextClose') }}
          </AppButton>
          <AppButton :to="`/news/${next.slug}`" variant="accent" size="lg" pill arrow>
            {{ t('newsPage.autoNextRead') }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.anx-backdrop,
.anx-pill,
.anx-card {
  --anx-open: 350ms;
  --anx-close: 250ms;
  --anx-distance: 16px;
  --anx-blur: 2px;
  --anx-scale: 0.97;
  --anx-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.anx-pill,
.anx-card {
  opacity: 0;
  transform: translateY(var(--anx-distance)) scale(var(--anx-scale));
  filter: blur(var(--anx-blur));
  will-change: transform, opacity, filter;
  transition:
    opacity var(--anx-close) var(--anx-ease),
    transform var(--anx-close) var(--anx-ease),
    filter var(--anx-close) var(--anx-ease);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.10);
}
.anx-backdrop {
  opacity: 0;
  transition: opacity var(--anx-close) var(--anx-ease);
}
.anx-card {
  transition-delay: 60ms;
}
.anx-backdrop {
  transition-delay: 120ms;
}
.anx-open .anx-backdrop {
  opacity: 1;
  transition: opacity var(--anx-open) var(--anx-ease);
  transition-delay: 0ms;
}
.anx-open .anx-pill,
.anx-open .anx-card {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
  transition:
    opacity var(--anx-open) var(--anx-ease),
    transform var(--anx-open) var(--anx-ease),
    filter var(--anx-open) var(--anx-ease);
}
.anx-open .anx-card {
  transition-delay: 60ms;
}
.anx-open .anx-pill {
  transition-delay: 240ms;
}
@media (prefers-reduced-motion: reduce) {
  .anx-backdrop,
  .anx-pill,
  .anx-card {
    transition: none !important;
  }
}
</style>
