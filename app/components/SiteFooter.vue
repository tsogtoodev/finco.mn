<script setup lang="ts">
// Site footer (Figma 568:5816 redesign): single light surface — link columns
// (About + Other stacked in the first column, then the two product catalogs),
// contact pill row, hairline divider, legal block with an inline privacy-policy
// link, and the Finco wordmark bleeding off the bottom edge. The product
// columns render the full catalog from the `products` collection so footer
// links always point at real, CMS-managed product pages.
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

// Contact details and social links come from the CMS `configuration` collection.
// The i18n strings stay as the fallback: they are what shipped, so a missing or
// unpublished CMS entry degrades to the current copy instead of a blank pill.
// Written as computeds over the raw config value rather than passing t() as the
// fallback argument, so switching locale still re-evaluates the fallback.
const { config } = await useSiteSettings()

const phone = computed(() => config('contact_phone').value || t('contact.phone'))
const email = computed(() => config('contact_email').value || t('contact.email'))

// No fallback URL on purpose: the previous hardcoded hrefs pointed at the bare
// facebook.com / youtube.com homepages, so an unset key is better represented by
// no icon than by a link that goes nowhere useful.
const socials = computed(() =>
  [
    { icon: 'f:facebook', href: config('social_facebook').value, label: 'Facebook' },
    { icon: 'f:instagram', href: config('social_instagram').value, label: 'Instagram' },
    { icon: 'f:youtube', href: config('social_youtube').value, label: 'YouTube' },
  ].filter((s) => s.href),
)
const disclaimer = computed(() => (tm('footer.disclaimer') as unknown[]).map((p) => rt(p as string)))

// --- elastic overscroll logo reveal ----------------------------------------
// iOS rubber-band at the end of the page: once you are already at the bottom,
// further downward wheel/drag pulls the footer contents up against increasing
// resistance, revealing the half of the wordmark that normally hangs below the
// footer's clip, then springs back on release.
//
// Nothing here touches the document scroll position — the effect is a transform
// on a dedicated wrapper, so page height never changes and no blank space is
// added. Lenis (see plugins/smooth-scroll.client.ts) owns the real scroll and
// simply clamps at the bottom, so the wheel deltas we read there are the ones it
// discards anyway; we never preventDefault on wheel and never fight it.
// How much of the wordmark is hidden below the footer's clip AT REST.
// 0 = fully visible, 0.5 = bottom half hidden (the design), 0.6 = 40% visible.
// This is the only knob for the cut — the pull ceiling derives from it (see
// `measure`), so deepening the cut automatically lengthens the pull needed to
// reveal the whole logo, up to MAX_PULL.
const LOGO_CUT = 0.5
// Wordmark aspect (<FincoWordmark> viewBox 1172 × 236) → its height as a % of
// its WIDTH. Percentage margins resolve against the containing block's width,
// never its height, which is why the cut has to be expressed in those units.
// Keep this in step with the component's viewBox: the cut, the pull ceiling and
// the overhang measurement all derive from it.
const LOGO_ASPECT_PCT = (236 / 1172) * 100
// Exposed as a custom property and applied via an `md:` arbitrary utility, so
// below md the wordmark shows IN FULL (the original design) — with the reveal
// now desktop-only, a permanent phone-side clip would hide half the logo with
// no way to ever see it.
const logoCutStyle = computed(() => ({
  '--logo-cut': `${-(LOGO_ASPECT_PCT * LOGO_CUT).toFixed(4)}%`,
}))

const MAX_PULL = 240 // px ceiling for the resisted distance
// Apple's rubber-band constant, from the widely reverse-engineered UIScrollView
// transfer function. 0.55 is the value Apple ships; lower = stiffer pull.
const RUBBER_C = 0.55
// Gesture distance that fully reveals the wordmark, as a multiple of the reveal
// distance itself. Apple's curve only APPROACHES its asymptote, so to make 100%
// reachable the asymptote is pushed out past the overhang and the output is
// clamped at the overhang instead — full reveal then lands at a finite pull.
// Must exceed 1 / RUBBER_C (≈1.82), below which the curve never gets there at all.
// Higher = longer pull, but also a gentler corner where the clamp bites (at 4 the
// curve still has ~20% of its initial slope there, so the stop reads as the pull
// running out rather than hitting a wall).
const FULL_PULL_RANGE = 4
// Asymptote as a multiple of the reveal distance, solved from
// resist(FULL_PULL_RANGE · R) = R:  d = R · kc / (kc − 1).
const CURVE_D_FACTOR = (FULL_PULL_RANGE * RUBBER_C) / (FULL_PULL_RANGE * RUBBER_C - 1)
const LOGO_PARALLAX = 0.2 // logo trails the wrapper → subtle depth
// ζ = damping / (2·√(stiffness·mass)) — 1 is critical, LOWER = bouncier.
// 14 with this mass → ζ≈0.53: one clear ~14% overshoot past rest (the visible
// bounce), a barely-there second wiggle, settled in ~600ms. (33 here was
// ζ≈1.24 — overdamped, i.e. no bounce at all.) To tune the bounce, set
// damping ≈ 2ζ·√(stiffness·mass) for the ζ you want.
const SPRING = { stiffness: 220, damping: 14, mass: 0.9 }
const WHEEL_IDLE_MS = 30 // no wheel for this long → release

const rootEl = ref<HTMLElement | null>(null)
const shiftEl = ref<HTMLElement | null>(null)
const logoEl = ref<HTMLElement | null>(null)

let active = false // effect wired up (i.e. motion allowed)
let raw = 0 // accumulated gesture distance, pre-resistance
let offset = 0 // resisted distance actually applied
let vel = 0 // spring velocity (px/s)
let springing = false
let dragging = false
let maxScroll = 0 // cached so touchmove never forces a reflow
let pullCeiling = MAX_PULL // clamped by the logo's real overhang
let frame = 0
let springFrame = 0
let lastFrameT = 0
let wheelIdle: ReturnType<typeof setTimeout> | null = null

// Apple's rubber-band transfer function:
//
//   y = (x · c · d) / (d + x · c)
//
// x = accumulated raw overscroll input, c = 0.55. Slope is c at the origin (the
// pull starts out tracking the gesture at just over half speed) and decays
// hyperbolically toward the asymptote d.
//
// d is NOT the reveal distance here — it sits CURVE_D_FACTOR× beyond it, so
// that the curve crosses the reveal distance at a finite pull
// (FULL_PULL_RANGE × it) and the wordmark can actually be pulled all the way
// out. The Math.min is what holds it there: past that point the footer stops
// dead rather than creeping toward an asymptote it can never reach. That corner
// is the price of a reachable 100% — see FULL_PULL_RANGE.
function resist(r: number) {
  const reveal = pullCeiling
  if (reveal <= 0) return 0
  const d = reveal * CURVE_D_FACTOR
  const xc = Math.max(0, r) * RUBBER_C
  return Math.min(reveal, (xc * d) / (d + xc))
}
// Inverse of resist(), solved for x: x = y·d / (c·(d − y)). Any time a new
// gesture picks up while an offset is already on screen (mid-spring wheel,
// re-grab on touch), `raw` MUST be re-derived from the live offset — resuming
// with the old accumulated raw snaps the footer to the old depth in one frame,
// which reads as a sudden jump. Inside the clamped region the map is many-to-one,
// so clamping y to the reveal distance picks the SMALLEST raw that holds the
// footer there: a re-grab at full reveal resumes right at the corner instead of
// inheriting however much dead over-pull the previous gesture piled up.
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
  // Hold the hint for the WHOLE interaction, including the spring's tail and
  // any overshoot through zero — toggling will-change mid-animation promotes/
  // demotes the compositor layer and shows up as a stutter right at the end.
  const engaged = dragging || springing || Math.abs(offset) > 0.1
  if (s) {
    s.style.transform = `translate3d(0, ${-offset}px, 0)`
    // will-change only while it is actually moving — a permanent hint on every
    // page would hold a compositor layer for nothing.
    s.style.willChange = engaged ? 'transform' : ''
  }
  if (l) {
    l.style.transform = `translate3d(0, ${offset * LOGO_PARALLAX}px, 0)`
    l.style.willChange = engaged ? 'transform' : ''
  }
}

// How far the wordmark actually hangs below the footer's clip — this is `d` in
// the rubber-band function. Pulling further than this would lift the logo's
// bottom edge into view and leave a gap under it, so the ceiling is whichever
// is smaller. This is the reveal distance the rubber-band curve is fitted to,
// not the curve's asymptote (which sits further out — see CURVE_D_FACTOR).
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
  const dt = Math.min((now - lastFrameT) / 1000, 1 / 30) // clamp tab-switch jumps
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

// --- wheel / trackpad ---
// Trackpad momentum keeps emitting decaying deltas long after the fingers lift,
// so arriving at the bottom mid-fling would otherwise yank the footer with no
// intent behind it. The pull therefore only ARMS for a wheel train whose FIRST
// event fires while already parked at the bottom: ≥WHEEL_GESTURE_GAP of wheel
// silence starts a new train (a deliberate re-scroll); a train that began
// mid-page stays unarmed for its entire life, inertia tail included — Lenis
// alone absorbs the fling and the page simply stops at the end.
const WHEEL_GESTURE_GAP = 160 // ms of silence separating two wheel gestures
let lastWheelT = -Infinity
let wheelArmed = false

function onWheel(e: WheelEvent) {
  if (!active) return
  const now = performance.now()
  if (now - lastWheelT > WHEEL_GESTURE_GAP) wheelArmed = atBottom()
  lastWheelT = now
  if (e.deltaY <= 0) {
    // Any upward intent hands control straight back to the page.
    if (offset > 0) release()
    return
  }
  if (!wheelArmed || !atBottom()) return
  // Picking the pull back up mid-spring: re-derive raw from the CURRENT offset
  // so the next notch continues from where the footer visibly is, instead of
  // snapping back to the depth the old accumulated raw implied.
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

// --- touch ---
let startY = 0
let startX = 0
let engageY = 0
let engageSeed = 0 // raw distance implied by the offset at engagement
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
    // Leave horizontal swipes (carousels) and normal upward scrolling alone;
    // only engage when we are already parked at the bottom and the finger is
    // still travelling up.
    if (Math.abs(t.clientX - startX) > Math.abs(dy)) return
    if (dy >= 0 || !atBottom()) return
    dragging = true
    stopSpring()
    engageY = t.clientY // measure the pull from HERE, not from touchstart
    // Seed with the gesture distance the CURRENT offset implies, so re-grabbing
    // the footer mid-spring continues seamlessly from where it visibly is.
    engageSeed = unresist(offset)
  }

  // Engaged: suppress the browser's own end-of-page rubber-band so ours reads
  // cleanly. This is why the listener is non-passive.
  if (e.cancelable) e.preventDefault()

  raw = Math.max(0, engageSeed + (engageY - t.clientY))
  offset = resist(raw)

  const now = performance.now()
  const dt = Math.max(now - lastT, 1)
  gestureVel = ((lastY - t.clientY) / dt) * 1000 // px/s, positive = pulling up
  lastY = t.clientY
  lastT = now
  schedule()
}

function onTouchEnd() {
  if (!dragging) return
  dragging = false
  // Carry a little of the throw into the spring so the release feels continuous.
  release(gestureVel * 0.25)
}

function onScroll() {
  if (!active) return
  // Scrolled away from the bottom with the footer still pulled → spring home.
  // This fires for the SAME upward wheel notch Lenis responds to, so it must
  // release smoothly — a reset() here zeroes a visible transform in one frame,
  // which was the main "sudden snap back" complaint.
  if (offset > 0 && !dragging && !springing && !atBottom()) release()
}

function onResize() {
  measure()
  if (offset > 0) reset()
}

let reduceMql: MediaQueryList | null = null
// Content growth (late images, fonts, CMS data) changes the page height without
// a resize event; a stale maxScroll makes atBottom() wrong in both directions —
// engaging mid-page or refusing to engage at the real bottom. Re-measure only;
// no reset, so an in-flight pull is never snapped by a background reflow.
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
  // Desktop-only (≥1024px, the site's lg breakpoint) and motion allowed.
  // Crossing the breakpoint or flipping reduced-motion cleanly tears the
  // listeners down and zeroes any leftover transform.
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
  <!-- `overflow-clip` (not hidden — it never becomes a scroll container, so
       sticky/fixed descendants keep working) is what conceals the wordmark's
       lower half at rest and during the pull. -->
  <footer ref="rootEl" class="relative overflow-clip bg-[#fbfbfb]">
    <!-- Dedicated transform wrapper: the elastic offset is applied HERE, never
         to body/main, so fixed and sticky elements elsewhere are untouched and
         the document keeps its natural height. -->
    <div ref="shiftEl">
      <div class="mx-auto w-full max-w-[1200px] px-6 lg:px-0 pt-20 pb-10 md:pb-0 lg:pt-[120px]">
      <!-- Link columns. Two balanced columns on mobile (meta groups | catalog
           groups, each pair stacked), expanding to three on desktop: the catalog
           wrapper is `md:contents` so at md its two groups dissolve into direct
           grid cells, giving [About+Other] [Individuals] [Business]. -->
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

      <!-- Contact -->
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

      <!-- Legal -->
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
