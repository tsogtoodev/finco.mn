<script setup lang="ts">
const { t } = useI18n()

const page = await usePageContent('home')
const copy = computed(() => ({
  heading: page.value?.beep?.heading ?? t('home.beep.heading'),
  subtext: page.value?.beep?.subtext ?? t('home.beep.subtext'),
  expandLead: page.value?.beep?.expandLead ?? t('home.beep.expandLead'),
  expandRest: page.value?.beep?.expandRest ?? t('home.beep.expandRest'),
  teaser: page.value?.beep?.teaser ?? t('home.beep.teaser'),
}))

const BEEP_URL = 'https://beep.finco.mn'
const qrOpen = ref(false)
const downloadBtn = ref<HTMLElement | null>(null)
const qrPop = ref<HTMLElement | null>(null)
const POP_W = 220
const qrStyle = ref<Record<string, string>>({})
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
  const left = Math.min(
    Math.max(8, r.left + r.width / 2 - POP_W / 2),
    window.innerWidth - POP_W - 8,
  )
  qrStyle.value = {
    left: `${Math.round(left)}px`,
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
  <section data-section="home-beep" class="bg-white px-6 pb-10 pt-[max(2.5rem,min(4.97vw,4.5rem))]">
    <div class="mx-auto w-full max-w-[1440px]">
      <div class="beep-card">
        <div class="beep-person beep-person--bleed" aria-hidden="true">
          <NuxtImg
            src="/images/home/beep-lifestyle.png"
            alt=""
            sizes="sm:420px md:640px lg:940px"
            class="beep-person-img"
          />
        </div>
        <div class="beep-clip">
          <img src="/images/home/beep-pills.png" alt="" aria-hidden="true" class="beep-pills">

          <div class="beep-dots-wrap">
            <div class="beep-dots-rot">
              <img
                src="/images/home/beep-halftone.svg"
                alt=""
                aria-hidden="true"
                decoding="async"
                loading="lazy"
                class="beep-dots-img"
              >
            </div>
          </div>

          <div class="beep-person">
            <NuxtImg
              src="/images/home/beep-lifestyle.png"
              alt=""
              aria-hidden="true"
              sizes="sm:420px md:640px lg:940px"
              class="beep-person-img"
            />
          </div>

          <div class="beep-fade" />

          <img
            src="/images/home/beep-wordmark-lime.svg"
            :alt="t('hero.wordmarkAlt')"
            class="beep-wordmark"
          >

          <div class="beep-heading">
            <h2 class="beep-title">{{ copy.heading }}</h2>
            <p class="beep-subtext">{{ copy.subtext }}</p>
          </div>

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
            <span class="beep-qr-row">
              <img src="/images/home/beep-qr.svg" alt="" width="140" height="140" class="beep-qr-img">
              <span class="beep-qr-stores">
                <img src="/images/home/beep-playstore.svg" alt="Google Play" class="beep-qr-store beep-qr-store--play">
                <img src="/images/home/beep-apple.svg" alt="App Store" class="beep-qr-store beep-qr-store--apple">
              </span>
            </span>
            <span class="beep-qr-cap">{{ t('home.beep.scanToDownload') }}</span>
          </span>
          <span class="beep-qr-caret" aria-hidden="true" />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
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
  border-radius: 2.7778cqw;
  background: linear-gradient(to top right, #000 0%, #0f2c23 100%);
}

.beep-pills {
  position: absolute;
  left: 36.164%;
  top: 15.499%;
  width: 70.916%;
  height: 40.829%;
  object-fit: cover;
  pointer-events: none;
}

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

.beep-fade {
  position: absolute;
  left: 0;
  top: 61.541%;
  width: 100%;
  height: 38.46%;
  background: linear-gradient(180deg, rgba(0, 31, 22, 0) 0%, #001f16 100%);
  pointer-events: none;
}

.beep-teaser {
  position: absolute;
  left: 54.427%;
  top: 98.156%;
  transform: translateY(-50%);
  font-weight: 200;
  font-size: 1.1111cqw;
  line-height: normal;
  color: rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  pointer-events: none;
}

.beep-plus {
  position: absolute;
  left: 95.153%;
  top: 4.688%;
  width: 2.7778cqw;
  height: 2.7778cqw;
  pointer-events: none;
}

.beep-wordmark {
  position: absolute;
  left: 2.966%;
  top: 38.294%;
  width: 18.012%;
  height: 13.278%;
}

.beep-heading {
  position: absolute;
  left: 2.925%;
  top: 4.703%;
}
.beep-title {
  font-weight: 600;
  font-size: 1.3889cqw;
  line-height: 2.2222cqw;
  color: #fff;
  white-space: nowrap;
}
.beep-subtext {
  margin-top: 0.5556cqw;
  width: 38.09cqw;
  font-weight: 300;
  font-size: 1.1111cqw;
  line-height: 1.6667cqw;
  color: rgba(255, 255, 255, 0.6);
}

.beep-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 29.545%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(0.9722cqw);
  -webkit-backdrop-filter: blur(0.9722cqw);
  border-radius: 0.8333cqw;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

@media (hover: hover) {
  .beep-bar {
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
  .beep-bar {
    transition: none;
  }
}
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
  gap: 16.6667cqw;
}
.beep-bar-text {
  flex: 1 1 0;
  min-width: 0;
  font-weight: 300;
  font-size: 1.25cqw;
  line-height: 1.8056cqw;
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
  gap: 1.6667cqw;
}
.beep-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5556cqw;
  padding: 0.5556cqw 1.1111cqw;
  border-radius: 999px;
  background: rgba(242, 242, 242, 0.15);
  white-space: nowrap;
  transition: background-color 0.2s ease;
}
.beep-btn--download {
  gap: 0.6944cqw;
  border: 1px solid #caff00;
}
.beep-btn:hover {
  background: rgba(242, 242, 242, 0.25);
}
.beep-btn-label {
  font-weight: 500;
  font-size: 1.1111cqw;
  color: #fff;
}
.beep-store-icon {
  display: block;
  height: 1.1111cqw;
}
.beep-store-icon--play {
  width: 0.9722cqw;
}
.beep-store-icon--apple {
  width: 0.9028cqw;
}
.beep-arrow {
  width: 1.1111cqw;
  height: 1.1111cqw;
  color: #fff;
}

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
  box-sizing: content-box;
}
.beep-qr-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.beep-qr-stores {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.beep-qr-store {
  display: block;
  height: 26px;
}
.beep-qr-store--play {
  width: 22.75px;
}
.beep-qr-store--apple {
  width: 21.125px;
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


@media (max-width: 1023.98px) {
  .beep-card {
    aspect-ratio: auto;
  }
  .beep-clip {
    position: relative;
    inset: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    border-radius: 1.5rem;
  }

  .beep-person--bleed,
  .beep-dots-wrap,
  .beep-fade {
    display: none;
  }

  .beep-pills {
    left: auto;
    right: -20%;
    top: 0;
    width: 76%;
    height: auto;
    opacity: 0.22;
    z-index: 0;
  }

  .beep-heading,
  .beep-wordmark,
  .beep-person,
  .beep-bar {
    position: relative;
    z-index: 1;
  }

  .beep-heading {
    order: 1;
    left: auto;
    top: auto;
  }
  .beep-title {
    font-size: 1.375rem;
    line-height: 1.3;
    white-space: normal;
  }
  .beep-subtext {
    margin-top: 0.5rem;
    width: 100%;
    font-size: 0.9375rem;
    line-height: 1.6;
  }

  .beep-wordmark {
    order: 2;
    left: auto;
    top: auto;
    width: 7.5rem;
    height: 2.7rem;
  }

  .beep-person {
    order: 3;
    left: auto;
    top: auto;
    width: 100%;
    height: 13.75rem;
    border-radius: 1rem;
  }
  .beep-person-img {
    position: static;
    width: 100%;
    height: 100%;
    max-width: 100%;
    object-fit: cover;
    object-position: 50% 12%;
  }

  .beep-bar {
    order: 4;
    height: auto;
    padding: 1rem;
    border-radius: 1rem;
    transform: none !important;
    opacity: 1 !important;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  .beep-bar-inner {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .beep-bar-text {
    font-size: 0.9375rem;
    line-height: 1.5;
  }
  .beep-bar-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .beep-btn {
    min-height: 2.75rem;
    gap: 0.5rem;
    padding: 0.625rem 1.125rem;
  }
  .beep-btn--download {
    gap: 0.5rem;
  }
  .beep-btn-label {
    font-size: 0.9375rem;
  }
  .beep-store-icon {
    height: 1rem;
  }
  .beep-store-icon--play {
    width: 0.875rem;
  }
  .beep-store-icon--apple {
    width: 0.8125rem;
  }
  .beep-arrow {
    width: 1rem;
    height: 1rem;
  }
}
</style>
