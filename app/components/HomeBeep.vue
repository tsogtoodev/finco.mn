<script setup lang="ts">
// Beep showcase (Figma 1:14222 → card 1:14223). Pixel-exact recreation of the
// 1440×704 artboard: solid #0f2c23 card with a baked pill-cluster raster, the
// lifestyle photo bleeding off the right, a lime halftone field, the Beep
// wordmark, heading copy and a permanent glass info bar. The whole card is a
// fixed 1440×704 coordinate stage that scales proportionally via container
// units, so it matches Figma exactly at ≥1440 and shrinks faithfully below.
const { t } = useI18n()

// Copy from the `pages` home doc's beep group (i18n fallback); the pill
// cluster, photo and layout stay baked/component-side.
const page = await usePageContent('home')
const copy = computed(() => ({
  heading: page.value?.beep?.heading ?? t('home.beep.heading'),
  subtext: page.value?.beep?.subtext ?? t('home.beep.subtext'),
  expandLead: page.value?.beep?.expandLead ?? t('home.beep.expandLead'),
  expandRest: page.value?.beep?.expandRest ?? t('home.beep.expandRest'),
  teaser: page.value?.beep?.teaser ?? t('home.beep.teaser'),
}))

// ── "Download app" → QR popover ────────────────────────────────────────────
// The info bar and the card both clip their overflow, so the popover is
// teleported to <body> and positioned `fixed`, anchored just above the button.
const BEEP_URL = 'https://beep.finco.mn'
const qrOpen = ref(false)
const downloadBtn = ref<HTMLElement | null>(null)
const qrPop = ref<HTMLElement | null>(null)
const POP_W = 184 // px; matches the popover's fixed width for centering math
const qrStyle = ref<Record<string, string>>({})
// Hover-intent timers so the button↔popover gap doesn't flicker it closed.
let qrOpenTimer: ReturnType<typeof setTimeout> | undefined
let qrCloseTimer: ReturnType<typeof setTimeout> | undefined
const QR_OPEN_DELAY = 100
const QR_CLOSE_DELAY = 160
function clearQrTimers() {
  clearTimeout(qrOpenTimer)
  clearTimeout(qrCloseTimer)
}

function positionQr() {
  const el = downloadBtn.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const GAP = 12
  // centre on the button, clamped into the viewport
  const left = Math.min(
    Math.max(8, r.left + r.width / 2 - POP_W / 2),
    window.innerWidth - POP_W - 8,
  )
  qrStyle.value = {
    left: `${Math.round(left)}px`,
    // grow upward from just above the button (no transform → free for the tween)
    bottom: `${Math.round(window.innerHeight - r.top + GAP)}px`,
    width: `${POP_W}px`,
  }
}
function openQr() {
  clearQrTimers()
  qrOpen.value = true
  nextTick(positionQr)
}
function closeQr() {
  clearQrTimers()
  qrOpen.value = false
}
function toggleQr() {
  qrOpen.value ? closeQr() : openQr()
}
// Hover: open on button enter (after a short intent delay); close once the
// pointer has left BOTH the button and the popover (the delay bridges the gap).
function hoverOpenQr() {
  clearTimeout(qrCloseTimer)
  if (qrOpen.value) return
  qrOpenTimer = setTimeout(openQr, QR_OPEN_DELAY)
}
function scheduleQrClose() {
  clearTimeout(qrOpenTimer)
  qrCloseTimer = setTimeout(closeQr, QR_CLOSE_DELAY)
}
function cancelQrClose() {
  clearTimeout(qrCloseTimer)
}

// Dismiss on outside press / Escape; reposition while open on scroll/resize.
function onDocPointer(e: Event) {
  if (!qrOpen.value) return
  const target = e.target as Node
  if (downloadBtn.value?.contains(target) || qrPop.value?.contains(target)) return
  closeQr()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && qrOpen.value) {
    closeQr()
    downloadBtn.value?.focus()
  }
}
function onReflow() {
  if (qrOpen.value) positionQr()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer, true)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onReflow, { passive: true })
  window.addEventListener('resize', onReflow)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onReflow)
  window.removeEventListener('resize', onReflow)
  clearQrTimers()
})
</script>

<template>
  <!-- Top padding reserves room for the photo head-bleed (71.45px above the
       card at 1440, scaling down with it) so it never overlaps the section
       above; Figma gives the card the same 71px headroom. -->
  <section data-section="home-beep" class="bg-white px-6 pb-10 pt-[max(2.5rem,min(4.97vw,4.5rem))]">
    <div class="mx-auto w-full max-w-[1440px]">
      <div class="beep-card">
        <!-- Unclipped copy of the lifestyle photo — Figma keeps a second
             "image 2058" outside the clip frame so the model's head bleeds
             above the card's top edge. Inside the card the clip's solid
             background covers this copy, so only the overflow shows. -->
        <div class="beep-person beep-person--bleed" aria-hidden="true">
          <img src="/images/home/beep-lifestyle.png" alt="" class="beep-person-img">
        </div>
        <div class="beep-clip">
          <!-- Pill cluster (baked raster, bleeds off the right edge) -->
          <img src="/images/home/beep-pills.png" alt="" aria-hidden="true" class="beep-pills">

          <!-- Lime halftone field -->
          <div class="beep-dots-wrap">
            <div class="beep-dots-rot">
              <img src="/images/home/beep-halftone.svg" alt="" aria-hidden="true" class="beep-dots-img">
            </div>
          </div>

          <!-- Lifestyle photo -->
          <div class="beep-person">
            <img src="/images/home/beep-lifestyle.png" alt="" aria-hidden="true" class="beep-person-img">
          </div>

          <!-- Bottom fade -->
          <div class="beep-fade" />

          <!-- Beep wordmark -->
          <img
            src="/images/home/beep-wordmark-lime.svg"
            :alt="t('hero.wordmarkAlt')"
            class="beep-wordmark"
          >

          <!-- Heading -->
          <div class="beep-heading">
            <h2 class="beep-title">{{ copy.heading }}</h2>
            <p class="beep-subtext">{{ copy.subtext }}</p>
          </div>

          <!-- Loyalty teaser — sits under the info bar, so it only reads in the
               unhovered state (Figma Variant2); the revealed bar covers it. -->
          <p class="beep-teaser">{{ copy.teaser }}</p>

          <!-- Plus affordance, top-right (Figma Huge-icon/solid/plus: 22.5px
               white cross in a 40px box) — hints that the card expands. -->
          <!-- <svg class="beep-plus" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M20 8.75v22.5M8.75 20h22.5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
          </svg> -->

          <!-- Info bar -->
          <div class="beep-bar" :class="{ 'beep-bar--pinned': qrOpen }">
            <div class="beep-bar-inner">
              <p class="beep-bar-text">
                <span class="beep-bar-lead">{{ copy.expandLead }}</span>
                {{ ' ' }}<span class="beep-bar-rest">{{ copy.expandRest }}</span>
              </p>
              <div class="beep-bar-actions">
                <button
                  ref="downloadBtn"
                  type="button"
                  class="beep-btn beep-btn--download"
                  aria-haspopup="dialog"
                  :aria-expanded="qrOpen"
                  @click="toggleQr"
                  @mouseenter="hoverOpenQr"
                  @mouseleave="scheduleQrClose"
                >
                  <img src="/images/home/beep-playstore.svg" alt="" aria-hidden="true" class="beep-store-icon beep-store-icon--play">
                  <img src="/images/home/beep-apple.svg" alt="" aria-hidden="true" class="beep-store-icon beep-store-icon--apple">
                  <span class="beep-btn-label">{{ t('home.beep.appDownload') }}</span>
                </button>
                <a :href="BEEP_URL" target="_blank" rel="noopener" class="beep-btn">
                  <span class="beep-btn-label">{{ t('common.learnMore') }}</span>
                  <Icon name="lucide:arrow-right" class="beep-arrow" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR popover for "Download app" — teleported out of the clipped card -->
    <Teleport to="body">
      <Transition name="qr-pop">
        <div
          v-if="qrOpen"
          ref="qrPop"
          role="dialog"
          :aria-label="t('home.beep.scanToDownload')"
          class="beep-qr-pop"
          :style="qrStyle"
          @mouseenter="cancelQrClose"
          @mouseleave="scheduleQrClose"
        >
          <span class="beep-qr-inner">
            <img src="/images/home/beep-qr.svg" alt="" width="140" height="140" class="beep-qr-img">
            <span class="beep-qr-cap">{{ t('home.beep.scanToDownload') }}</span>
          </span>
          <span class="beep-qr-caret" aria-hidden="true" />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
/* 1440×704 stage. cqw inside resolves to this card's width (=1440px at ≥1440). */
.beep-card {
  position: relative;
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
  aspect-ratio: 1440 / 704;
  container-type: inline-size;
}
.beep-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 2.7778cqw; /* 40px */
  background: #0f2c23;
}

/* Pills raster — left 520.76 top 109.11 w 1021.191 h 287.436 */
.beep-pills {
  position: absolute;
  left: 36.164%;
  top: 15.499%;
  width: 70.916%;
  height: 40.829%;
  object-fit: cover;
  pointer-events: none;
}

/* Halftone field — Figma inset / rotate / skew reproduced verbatim */
.beep-dots-wrap {
  position: absolute;
  inset: -37% 4.85% -102.07% -33.87%;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.beep-dots-rot {
  flex: none;
  transform: rotate(-60deg) skewX(-3.64deg);
  width: hypot(22.5476cqw, 43.1094cqh);
  height: hypot(77.4524cqw, 56.8906cqh);
}
.beep-dots-img {
  display: block;
  width: 100%;
  height: 100%;
}

/* Lifestyle photo — left 776.29 top -71.45 w 663.709 h 775.564.
   Rendered twice like Figma: once inside .beep-clip (composited under the
   bottom fade) and once as .beep-person--bleed directly in .beep-card, where
   nothing clips it, so the head rises above the card's top edge. */
.beep-person {
  position: absolute;
  left: 53.909%;
  top: -10.149%;
  width: 46.091%;
  height: 110.165%;
  overflow: hidden;
  pointer-events: none;
}
.beep-person-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 141.77%;
  height: 121.33%;
  max-width: none;
  display: block;
}

/* Bottom fade — top 433.25 h 270.752, transparent → #001f16 */
.beep-fade {
  position: absolute;
  left: 0;
  top: 61.541%;
  width: 100%;
  height: 38.46%;
  background: linear-gradient(180deg, rgba(0, 31, 22, 0) 0%, #001f16 100%);
  pointer-events: none;
}

/* Loyalty teaser — left 783.75, centre-y 691.02 of 704; black 90% on the dark
   fade (per Figma), painted below the info bar so the bar hides it on hover */
.beep-teaser {
  position: absolute;
  left: 54.427%;
  top: 98.156%;
  transform: translateY(-50%);
  font-weight: 200;
  font-size: 1.1111cqw; /* 16px */
  line-height: normal;
  color: rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  pointer-events: none;
}

/* Plus affordance — 40×40 box at left 1370.2 / top 33 */
.beep-plus {
  position: absolute;
  left: 95.153%;
  top: 4.688%;
  width: 2.7778cqw; /* 40px */
  height: 2.7778cqw;
  pointer-events: none;
}

/* Wordmark — left 42.71 top 269.59 w 259.379 h 93.477 */
.beep-wordmark {
  position: absolute;
  left: 2.966%;
  top: 38.294%;
  width: 18.012%;
  height: 13.278%;
}

/* Heading — left 42.12 top 33.11 */
.beep-heading {
  position: absolute;
  left: 2.925%;
  top: 4.703%;
}
.beep-title {
  font-weight: 600;
  font-size: 1.3889cqw; /* 20px */
  line-height: 2.2222cqw; /* 32px */
  color: #fff;
  white-space: nowrap;
}
.beep-subtext {
  margin-top: 0.5556cqw; /* 8px */
  width: 38.09cqw; /* 548.49px */
  font-weight: 300;
  font-size: 1.1111cqw; /* 16px */
  line-height: 1.6667cqw; /* 24px */
  color: rgba(255, 255, 255, 0.6);
}

/* Info bar — bottom band, h 208 */
.beep-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 29.545%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(0.9722cqw); /* frosted glass — 14px @1440 */
  -webkit-backdrop-filter: blur(0.9722cqw);
  border-radius: 0.8333cqw; /* 12px */
  /* Glass rim: light top-edge highlight + faint full ring */
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

/* Reveal-on-hover: where a pointer can hover, the bar is tucked below the clip's
   edge (overflow:hidden hides it) and slides up when the card is hovered or a
   button inside it is focused. On touch / no-hover devices it stays visible so
   it's never unreachable. */
@media (hover: hover) {
  .beep-bar {
    /* Figma Variant2 (unhovered): bar sits at y 691.13 vs 496 docked —
       195.13/208 = 93.81% of its own height — at opacity 0; the hover
       reaction smart-animates to Default over ~0.51s (Gentle). */
    transform: translateY(93.81%);
    opacity: 0;
    transition:
      transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.35s ease;
  }
  .beep-card:hover .beep-bar,
  .beep-card:focus-within .beep-bar {
    transform: translateY(0);
    opacity: 1;
  }
}
@media (hover: hover) and (prefers-reduced-motion: reduce) {
  /* honour reduced-motion: still reveal, but without the slide/fade tween */
  .beep-bar {
    transition: none;
  }
}
/* Keep the bar revealed while the QR popover is open. A button click doesn't
   reliably move focus on macOS, so :focus-within alone won't hold it — pin it. */
.beep-bar--pinned {
  transform: translateY(0) !important;
  opacity: 1 !important;
}
.beep-bar-inner {
  position: relative;
  width: 91.042%;
  height: 100%;
  margin-inline: auto;
  display: flex;
  align-items: center;
  gap: 16.6667cqw; /* 240px */
}
.beep-bar-text {
  flex: 1 1 0;
  min-width: 0;
  font-weight: 300;
  font-size: 1.25cqw; /* 18px */
  line-height: 1.8056cqw; /* 26px */
  color: rgba(255, 255, 255, 0.84);
}
.beep-bar-lead {
  font-weight: 700;
  color: #fff;
}
.beep-bar-rest {
  font-weight: 200;
  color: rgba(255, 255, 255, 0.76);
}
.beep-bar-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 1.6667cqw; /* 24px */
}
.beep-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5556cqw; /* 8px */
  padding: 0.5556cqw 1.1111cqw; /* 8px 16px */
  border-radius: 999px;
  background: rgba(242, 242, 242, 0.15);
  white-space: nowrap;
  transition: background-color 0.2s ease;
}
.beep-btn--download {
  gap: 0.6944cqw; /* 10px */
  border: 1px solid #caff00;
}
.beep-btn:hover {
  background: rgba(242, 242, 242, 0.25);
}
.beep-btn-label {
  font-weight: 500;
  font-size: 1.1111cqw; /* 16px */
  color: #fff;
}
.beep-store-icon {
  display: block;
  height: 1.1111cqw; /* 16px */
}
.beep-store-icon--play {
  width: 0.9722cqw; /* 14px */
}
.beep-store-icon--apple {
  width: 0.9028cqw; /* 13px */
}
.beep-arrow {
  width: 1.1111cqw; /* 16px */
  height: 1.1111cqw;
  color: #fff;
}

/* ── "Download app" QR popover ─────────────────────────────────────────────
   Teleported to <body>, so it lives outside the card's container context —
   sized in plain px (no cqw) and positioned `fixed` via the inline qrStyle. */
.beep-qr-pop {
  position: fixed;
  z-index: 70;
  box-sizing: border-box;
  padding: 14px;
  border-radius: 18px;
  background: #0f2c23;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 50px -12px rgba(0, 0, 0, 0.55);
}
.beep-qr-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.beep-qr-img {
  display: block;
  width: 140px;
  height: 140px;
  padding: 8px;
  border-radius: 10px;
  background: #fff;
  box-sizing: content-box; /* keep the QR crisp at 140px + an 8px quiet zone */
}
.beep-qr-cap {
  max-width: 156px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.82);
}
.beep-qr-caret {
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: #0f2c23;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  transform: translateX(-50%) rotate(45deg);
}
.qr-pop-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.qr-pop-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}
.qr-pop-enter-from,
.qr-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .qr-pop-enter-from,
  .qr-pop-leave-to {
    transform: none;
  }
}
</style>
