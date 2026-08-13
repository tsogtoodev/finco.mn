<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')

const videoEl = useTemplateRef<HTMLVideoElement>('videoEl')
const videoEnabled = ref(false)

let frame: number | null = null

const PREROLL_PX = 600

function shouldPlay(el: HTMLVideoElement) {
  if (document.hidden) return false
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return false
  if (r.bottom < -PREROLL_PX || r.top > window.innerHeight + PREROLL_PX) return false

  const top = Math.max(r.top, 0)
  const bottom = Math.min(r.bottom, window.innerHeight)
  const left = Math.max(r.left, 0)
  const right = Math.min(r.right, window.innerWidth)
  const cover = document.querySelector('#home-products')?.getBoundingClientRect()
  if (bottom > top && right > left && cover
    && cover.top <= top && cover.left <= left && cover.right >= right) return false
  return true
}

function sync() {
  if (frame !== null) {
    cancelAnimationFrame(frame)
    frame = null
  }
  const el = videoEl.value
  if (!el) return
  if (shouldPlay(el)) {
    if (el.paused) void el.play().catch(() => {})
  }
  else if (!el.paused) {
    el.pause()
  }
}

function schedule() {
  if (frame === null) frame = requestAnimationFrame(sync)
}

const FADE_MS = 550
const WRAP_GUARD_MS = 60

const faded = ref(false)
const cycle = ref(0)
let fadeTimer: ReturnType<typeof setTimeout> | null = null
let dipped = false

function armFade() {
  const el = videoEl.value
  if (fadeTimer !== null) clearTimeout(fadeTimer)
  fadeTimer = null
  if (!el || el.paused || !Number.isFinite(el.duration)) return

  const remaining = (el.duration - el.currentTime) * 1000
  if (remaining <= FADE_MS) {
    faded.value = true
    dipped = true
    fadeTimer = setTimeout(armFade, remaining + WRAP_GUARD_MS)
  }
  else {
    if (dipped) {
      dipped = false
      cycle.value++
    }
    faded.value = false
    fadeTimer = setTimeout(armFade, remaining - FADE_MS)
  }
}

function cancelFade() {
  if (fadeTimer !== null) clearTimeout(fadeTimer)
  fadeTimer = null
  dipped = false
  faded.value = false
}

const MAX_BLUR_PX = 20

const sectionEl = useTemplateRef<HTMLElement>('sectionEl')
const coverage = ref(0)

function measureCoverage() {
  const el = sectionEl.value
  const cover = document.querySelector('#home-products')?.getBoundingClientRect()
  if (!el || !cover) {
    coverage.value = 0
    return
  }
  const r = el.getBoundingClientRect()
  const top = Math.max(r.top, 0)
  const bottom = Math.min(r.bottom, window.innerHeight)
  const visible = bottom - top
  coverage.value = visible > 0 ? Math.min(Math.max((bottom - cover.top) / visible, 0), 1) : 0
}

const coverageScroll = useScrollSync(measureCoverage)

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  coverageScroll.start()
  measureCoverage()
  videoEnabled.value = true
  await nextTick()
  const el = videoEl.value
  if (el) {
    el.muted = true
    el.addEventListener('timeupdate', armFade)
    el.addEventListener('play', armFade)
    el.addEventListener('pause', cancelFade)
  }
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule, { passive: true })
  document.addEventListener('visibilitychange', sync)
  sync()
})

onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame)
  cancelFade()
  const el = videoEl.value
  if (el) {
    el.removeEventListener('timeupdate', armFade)
    el.removeEventListener('play', armFade)
    el.removeEventListener('pause', cancelFade)
  }
  removeEventListener('scroll', schedule)
  removeEventListener('resize', schedule)
  document.removeEventListener('visibilitychange', sync)
})

const heading = computed(() => page.value?.statsHeading ?? t('home.stats.heading'))
const stats = computed(
  () =>
    page.value?.stats ?? [
      { value: 71000, label: t('home.stats.customers.label') },
      { value: 70, prefix: '₮', suffix: t('home.stats.funding.unit'), label: t('home.stats.funding.label') },
      { value: 26000, suffix: '+', label: t('home.stats.users.label') },
    ],
)

const MASKS = ['mask-1', 'mask-2', 'mask-3']
</script>

<template>
  <section
    ref="sectionEl"
    class="relative isolate overflow-hidden bg-[#0a0a1a] px-6 py-6 lg:py-32"
    :style="coverage > 0 ? { filter: `blur(${(coverage * MAX_BLUR_PX).toFixed(2)}px)` } : undefined"
  >
    <div
      aria-hidden="true"
      class="pointer-events-none absolute left-1/2 top-1/2 hidden h-full w-full -translate-x-1/2 -translate-y-1/2 sm:block [background:radial-gradient(ellipse_58%_17%_at_50%_38%,rgba(74,57,208,0.30)_0%,rgba(74,57,208,0.14)_45%,transparent_78%)]"
    />
    <div class="pointer-events-none absolute left-1/2 top-4/7 hidden h-full min-h-[51vw] w-full -translate-x-1/2 -translate-y-[calc(50%+100px)] scale-120 sm:block">
      <video
        v-if="videoEnabled"
        ref="videoEl"
        src="/videos/HomeStats-30fps.webm"
        poster="/images/home/stats-wave.png"
        aria-hidden="true"
        class="size-full object-cover"
        :style="{ opacity: faded ? 0 : 1, transition: `opacity ${FADE_MS}ms linear` }"
        loop
        muted
        playsinline
        disablepictureinpicture
        preload="none"
      />
    </div>
    <NuxtImg
      src="/images/home/stats-wave.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full object-cover sm:hidden"
    />
    <div class="pointer-events-none absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-[#0a0a1a] to-transparent" />
    <div class="pointer-events-none absolute inset-y-0 right-0 w-[28%] bg-gradient-to-l from-[#0a0a1a] to-transparent" />

    <div class="relative mx-auto flex w-full max-w-[1200px] flex-col items-center">
      <MotionReveal
        as="h2"
        class="max-w-[1015px] text-center font-display text-[24px] font-semibold leading-tight tracking-wide text-white mb-[40px]"
      >
        {{ heading }}
      </MotionReveal>

      <div class="mt-24 grid w-full grid-cols-1 gap-12 sm:mt-80 sm:grid-cols-3 sm:gap-6">
        <div
          v-for="(s, i) in stats"
          :key="i"
          class="relative flex flex-col items-center gap-2 text-center"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute left-1/2 top-0 hidden w-px -translate-x-1/2 -translate-y-[134px] sm:block [background:linear-gradient(to_bottom,#3b06cd_0%,#cd06ab_15.87%,#600a51_31.73%,rgba(118,70,108,0)_100%)]"
            :class="i === 1 ? 'h-[156px]' : 'h-[126px]'"
            style="transform: scaleY(-1)"
          />
          <p class="relative font-display text-5xl font-semibold text-white leading-tight mt-6" :class="MASKS[i % MASKS.length]">
            <span v-if="s.prefix">{{ s.prefix }}</span><StatCounter :value="s.value" :replay="cycle" /><span
              v-if="s.suffix"
              :class="s.prefix ? 'text-2xl' : ''"
            >{{ s.suffix }}</span>
          </p>
          <p class="relative text-[15px] font-extralight tracking-wide text-white/80">{{ s.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mask-1,
.mask-2,
.mask-3 {
  position: relative;
}
.mask-1::after,
.mask-2::after,
.mask-3::after {
  content: '';
  position: absolute;
  inset: 0;
  mix-blend-mode: darken;
  pointer-events: none;
}
.mask-1::after {
  background: linear-gradient(90deg, #DBB9FF 0%, #6A92FF 100%);
}
.mask-2::after {
  background: linear-gradient(90deg, #998CFF 0%, #EAC2FF 100%);
}
.mask-3::after {
  background: linear-gradient(90deg, #E7E3FF 0%, #D628ED 100%);
}
</style>
