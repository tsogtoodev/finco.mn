<script setup lang="ts">
const { t, tm, rt } = useI18n()
const localePath = useLocalePath()

const catalog = await useProductList()
const productLinks = (audience: 'individual' | 'business') =>
  (catalog.value ?? [])
    .filter((p) => p.audience === audience)
    .map((p) => ({ label: p.title, to: `/products/${p.slug}` }))

const aboutGroup = computed(() => ({
  heading: t('footer.about'),
  links: [
    { label: t('footer.intro'), to: '/about' },
    { label: t('footer.links.branches'), to: '/branches' },
    { label: t('footer.reports'), to: '/about' },
  ],
}))

const otherGroup = computed(() => ({
  heading: t('footer.other'),
  links: [
    { label: t('footer.links.trust'), to: '/services/trust' },
    { label: t('footer.links.careers'), to: '/careers' },
    { label: t('footer.links.news'), to: '/news' },
    { label: t('footer.links.fincobiz'), to: '/business' },
    { label: t('footer.links.beep'), to: '/products' },
  ],
}))

const individualsGroup = computed(() => ({
  heading: t('footer.individuals'),
  links: productLinks('individual'),
}))

const businessGroup = computed(() => ({
  heading: t('footer.business'),
  links: productLinks('business'),
}))

const { config } = await useSiteSettings()

const phone = computed(() => config('contact_phone').value || t('contact.phone'))
const email = computed(() => config('contact_email').value || t('contact.email'))

const socials = computed(() =>
  [
    { icon: 'f:facebook', href: config('social_facebook').value, label: 'Facebook' },
    { icon: 'f:instagram', href: config('social_instagram').value, label: 'Instagram' },
    { icon: 'f:youtube', href: config('social_youtube').value, label: 'YouTube' },
  ].filter((s) => s.href),
)
const disclaimer = computed(() => (tm('footer.disclaimer') as unknown[]).map((p) => rt(p as string)))

const LOGO_CUT = 0.5
const LOGO_ASPECT_PCT = (236 / 1172) * 100
const logoCutStyle = computed(() => ({
  '--logo-cut': `${-(LOGO_ASPECT_PCT * LOGO_CUT).toFixed(4)}%`,
}))

const MAX_PULL = 240
const RUBBER_C = 0.55
const FULL_PULL_RANGE = 4
const CURVE_D_FACTOR = (FULL_PULL_RANGE * RUBBER_C) / (FULL_PULL_RANGE * RUBBER_C - 1)
const LOGO_PARALLAX = 0.2
const SPRING = { stiffness: 220, damping: 14, mass: 0.9 }
const WHEEL_IDLE_MS = 30

const rootEl = ref<HTMLElement | null>(null)
const shiftEl = ref<HTMLElement | null>(null)
const logoEl = ref<HTMLElement | null>(null)

let active = false
let raw = 0
let offset = 0
let vel = 0
let springing = false
let dragging = false
let maxScroll = 0
let pullCeiling = MAX_PULL
let frame = 0
let springFrame = 0
let lastFrameT = 0
let wheelIdle: ReturnType<typeof setTimeout> | null = null

function resist(r: number) {
  const reveal = pullCeiling
  if (reveal <= 0) return 0
  const d = reveal * CURVE_D_FACTOR
  const xc = Math.max(0, r) * RUBBER_C
  return Math.min(reveal, (xc * d) / (d + xc))
}

function unresist(o: number) {
  const reveal = pullCeiling
  if (reveal <= 0) return 0
  const d = reveal * CURVE_D_FACTOR
  const y = Math.min(Math.max(0, o), reveal)
  return (y * d) / (RUBBER_C * (d - y))
}

function applyTransforms() {
  const s = shiftEl.value
  const l = logoEl.value
  const engaged = dragging || springing || Math.abs(offset) > 0.1
  if (s) {
    s.style.transform = `translate3d(0, ${-offset}px, 0)`
    s.style.willChange = engaged ? 'transform' : ''
  }
  if (l) {
    l.style.transform = `translate3d(0, ${offset * LOGO_PARALLAX}px, 0)`
    l.style.willChange = engaged ? 'transform' : ''
  }
}

function measure() {
  const root = rootEl.value
  const logo = logoEl.value
  maxScroll = document.documentElement.scrollHeight - window.innerHeight
  if (!root || !logo) return
  const overhang = logo.getBoundingClientRect().bottom - root.getBoundingClientRect().bottom
  const revealable = Math.max(0, overhang) / (1 - LOGO_PARALLAX)
  pullCeiling = Math.max(0, Math.min(MAX_PULL, revealable))
}

const atBottom = () => window.scrollY >= maxScroll - 2

function schedule() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    applyTransforms()
  })
}

function stopSpring() {
  springing = false
  if (springFrame) {
    cancelAnimationFrame(springFrame)
    springFrame = 0
  }
}

function springStep(now: number) {
  const dt = Math.min((now - lastFrameT) / 1000, 1 / 30)
  lastFrameT = now
  const a = (-SPRING.stiffness * offset - SPRING.damping * vel) / SPRING.mass
  vel += a * dt
  offset += vel * dt
  if (Math.abs(offset) < 0.3 && Math.abs(vel) < 4) {
    offset = 0
    vel = 0
    raw = 0
    springing = false
    springFrame = 0
    applyTransforms()
    return
  }
  applyTransforms()
  springFrame = requestAnimationFrame(springStep)
}

function release(seedVelocity = 0) {
  if (springing || offset <= 0) {
    if (offset <= 0) reset()
    return
  }
  vel = seedVelocity
  springing = true
  lastFrameT = performance.now()
  springFrame = requestAnimationFrame(springStep)
}

function reset() {
  stopSpring()
  dragging = false
  raw = 0
  offset = 0
  vel = 0
  applyTransforms()
}

const WHEEL_GESTURE_GAP = 160
let lastWheelT = -Infinity
let wheelArmed = false

function onWheel(e: WheelEvent) {
  if (!active) return
  const now = performance.now()
  if (now - lastWheelT > WHEEL_GESTURE_GAP) wheelArmed = atBottom()
  lastWheelT = now
  if (e.deltaY <= 0) {
    if (offset > 0) release()
    return
  }
  if (!wheelArmed || !atBottom()) return
  if (springing) {
    stopSpring()
    raw = unresist(offset)
  }
  raw += e.deltaY
  offset = resist(raw)
  schedule()
  if (wheelIdle) clearTimeout(wheelIdle)
  wheelIdle = setTimeout(() => release(), WHEEL_IDLE_MS)
}

let startY = 0
let startX = 0
let engageY = 0
let engageSeed = 0
let lastY = 0
let lastT = 0
let gestureVel = 0

function onTouchStart(e: TouchEvent) {
  if (!active) return
  const t = e.touches[0]
  if (!t) return
  startY = lastY = t.clientY
  startX = t.clientX
  lastT = performance.now()
  gestureVel = 0
  dragging = false
}

function onTouchMove(e: TouchEvent) {
  if (!active) return
  const t = e.touches[0]
  if (!t) return
  const dy = t.clientY - startY

  if (!dragging) {
    if (Math.abs(t.clientX - startX) > Math.abs(dy)) return
    if (dy >= 0 || !atBottom()) return
    dragging = true
    stopSpring()
    engageY = t.clientY
    engageSeed = unresist(offset)
  }

  if (e.cancelable) e.preventDefault()

  raw = Math.max(0, engageSeed + (engageY - t.clientY))
  offset = resist(raw)

  const now = performance.now()
  const dt = Math.max(now - lastT, 1)
  gestureVel = ((lastY - t.clientY) / dt) * 1000
  lastY = t.clientY
  lastT = now
  schedule()
}

function onTouchEnd() {
  if (!dragging) return
  dragging = false
  release(gestureVel * 0.25)
}

function onScroll() {
  if (!active) return
  if (offset > 0 && !dragging && !springing && !atBottom()) release()
}

function onResize() {
  measure()
  if (offset > 0) reset()
}

let reduceMql: MediaQueryList | null = null
let docResizeObserver: ResizeObserver | null = null

function bind() {
  if (typeof ResizeObserver !== 'undefined') {
    docResizeObserver = new ResizeObserver(() => measure())
    docResizeObserver.observe(document.documentElement)
  }
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onResize, { passive: true })
}
function unbind() {
  docResizeObserver?.disconnect()
  docResizeObserver = null
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchEnd)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
}

let desktopMql: MediaQueryList | null = null

function applyEligibility() {
  const allowed = !reduceMql?.matches && !!desktopMql?.matches
  if (allowed === active) return
  active = allowed
  if (active) {
    measure()
    bind()
  }
  else {
    unbind()
    reset()
  }
}

onMounted(() => {
  reduceMql = window.matchMedia('(prefers-reduced-motion: reduce)')
  desktopMql = window.matchMedia('(min-width: 1024px)')
  reduceMql.addEventListener('change', applyEligibility)
  desktopMql.addEventListener('change', applyEligibility)
  applyEligibility()
})

onBeforeUnmount(() => {
  reduceMql?.removeEventListener('change', applyEligibility)
  desktopMql?.removeEventListener('change', applyEligibility)
  if (wheelIdle) clearTimeout(wheelIdle)
  if (frame) cancelAnimationFrame(frame)
  stopSpring()
  unbind()
})
</script>

<template>
  <footer ref="rootEl" class="relative overflow-clip bg-[#fbfbfb]">
    <div ref="shiftEl">
      <div class="mx-auto w-full max-w-[1200px] px-6 lg:px-0 pt-20 pb-10 md:pb-0 lg:pt-[120px]">
      <div class="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3">
        <div class="flex flex-col gap-[48px]">
          <div v-for="col in [aboutGroup, otherGroup]" :key="col.heading">
            <h3 class="text-sm text-accent">{{ col.heading }}</h3>
            <div class="mt-[16px] space-y-[16px] text-sm font-light leading-normal">
              <div v-for="l in col.links" :key="l.label">
                <NuxtLink
                  :to="localePath(l.to)"
                  class="block text-black/60 transition-colors hover:text-foreground text-[14px] leading-[18px]"
                >
                  {{ l.label }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-[48px] md:contents">
          <div v-for="col in [individualsGroup, businessGroup]" :key="col.heading">
            <h3 class="text-sm text-accent">{{ col.heading }}</h3>
            <div class="mt-[16px] space-y-[16px] text-sm font-light leading-normal">
              <div v-for="l in col.links" :key="l.label">
                <NuxtLink
                  :to="localePath(l.to)"
                  class="block text-black/60 transition-colors hover:text-foreground text-[14px] leading-[18px]"
                >
                  {{ l.label }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12">
        <h3 class="text-sm text-accent">{{ t('footer.contact') }}</h3>
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener"
            :aria-label="s.label"
            class="flex size-9 items-center justify-center rounded-full bg-black/[0.03] text-dark transition-colors hover:bg-black/10"
          >
            <Icon :name="s.icon" class="text-[20px]" />
          </a>
          <a
            :href="`tel:${phone.replace(/\s/g, '')}`"
            class="rounded-full bg-black/[0.03] px-4 py-2 text-[13px] text-black/[0.64] underline transition-colors hover:bg-black/10"
          >
            {{ phone }}
          </a>
          <a
            :href="`mailto:${email}`"
            class="rounded-full bg-black/[0.03] px-4 py-2 text-[13px] text-black/[0.64] underline transition-colors hover:bg-black/10"
          >
            {{ email }}
          </a>
          <NuxtLink
            :to="localePath('/branches')"
            class="rounded-full bg-black/[0.03] px-4 py-2 text-[13px] text-black/[0.64] underline transition-colors hover:bg-black/10"
          >
            {{ t('footer.viewLocations') }}
          </NuxtLink>
        </div>
      </div>

      <div class="mt-8 h-px w-full bg-black/10" />

      <div class="mt-8">
        <p class="text-xs font-light leading-5 text-black/60">{{ t('footer.rights') }}</p>
        <div class="mt-[16px] space-y-[16px] text-xs font-thin leading-[18px] text-black/50">
          <p v-for="(para, i) in disclaimer" :key="i">{{ para }}</p>
          <p>
            {{ t('footer.privacyPre') }}<NuxtLink
              :to="localePath('/legal/privacy')"
              class="font-light text-accent underline"
            >{{ t('footer.privacyLink') }}</NuxtLink>{{ t('footer.privacyPost') }}
          </p>
        </div>
      </div>

        <div ref="logoEl" class="mt-10" aria-hidden="true">
          <FincoWordmark class="block w-full text-black/10 md:[margin-bottom:var(--logo-cut)]" :style="logoCutStyle" />
        </div>
      </div>
    </div>
  </footer>
</template>
