<script setup lang="ts">
import { useInView } from 'motion-v'
import glowOuter from '~/assets/images/beep2-glow-outer.svg'
import glowMid from '~/assets/images/beep2-glow-mid.svg'
import glowInner from '~/assets/images/beep2-glow-inner.svg'
import wordmark from '~/assets/images/beep-wordmark-dark.svg'

const { t } = useI18n()

const page = await usePageContent('home')
const copy = computed(() => ({
  lead: page.value?.beep?.expandLead ?? t('home.beep.expandLead'),
  rest: page.value?.beep?.expandRest ?? t('home.beep.expandRest'),
  downloadLabel: page.value?.beep?.downloadLabel ?? `${t('home.beep.appDownload')}:`,
}))

const qrSrc = computed(() => page.value?.beep?.qr || '/images/home/beep-qr-v2.png')

const words = computed(() => {
  const split = (s: string) => s.trim().split(/\s+/).filter(Boolean)
  return [
    ...split(copy.value.lead).map((w) => ({ w, bold: true })),
    ...split(copy.value.rest).map((w) => ({ w, bold: false })),
  ]
})

const textEl = ref<HTMLElement | null>(null)
const textInView = useInView(textEl, { once: true, amount: 0.1 })

const WORD_FROM = { filter: 'blur(10px)', opacity: 0, y: -20 }
const WORD_KEYFRAMES = {
  filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
  opacity: [0, 0.5, 1],
  y: [-20, 5, 0],
}
const wordTransition = (i: number) => ({
  duration: 0.44,
  times: [0, 0.5, 1],
  delay: 0.05 + i * 0.02,
})

const textSettled = ref(false)

const sectionEl = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
let videoPlayed = false
let videoIo: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !sectionEl.value) return
  videoIo = new IntersectionObserver(
    (entries) => {
      if (!entries[entries.length - 1]?.isIntersecting || videoPlayed) return
      videoPlayed = true
      videoIo?.disconnect()
      videoIo = null
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const v = videoEl.value
      if (!v) return
      v.muted = true
      v.play().catch(() => {})
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  )
  videoIo.observe(sectionEl.value)
})
onBeforeUnmount(() => videoIo?.disconnect())
</script>

<template>
  <section ref="sectionEl" data-section="home-beep" class="overflow-hidden bg-[rgba(242,242,233,0.5)]">
    <div class="beep2-stage">
      <div class="beep2-glow" aria-hidden="true">
        <img :src="glowOuter" alt="" class="beep2-glow-img" style="--d: 100%">
        <img :src="glowMid" alt="" class="beep2-glow-img" style="--d: 73.28%">
      </div>

      <div class="beep2-person" aria-hidden="true">
        <video
          ref="videoEl"
          src="/videos/beep.mp4"
          class="beep2-person-img beep2-person-video"
          muted
          playsinline
          preload="auto"
          style="mix-blend-mode: darken;"
        />
      </div>

      <div class="beep2-col">
        <div class="beep2-copy">
          <MotionReveal :y="32">
            <img :src="wordmark" :alt="t('hero.wordmarkAlt')" class="beep2-wordmark">
          </MotionReveal>
          <p
            ref="textEl"
            class="beep2-text"
            :class="textSettled ? 'beep2-text--settled' : undefined"
          >
            <Motion
              v-for="(seg, i) in words"
              :key="`${i}-${seg.w}`"
              as="span"
              :initial="WORD_FROM"
              :animate="textInView ? WORD_KEYFRAMES : WORD_FROM"
              :transition="wordTransition(i)"
              :style="{ display: 'inline-block' }"
              :class="seg.bold ? 'beep2-text-lead' : undefined"
              :on-animation-complete="i === words.length - 1 ? () => (textSettled = true) : undefined"
            >{{ seg.w + (i < words.length - 1 ? ' ' : '') }}</Motion>
          </p>
        </div>

        <div class="beep2-qr">
          <MotionReveal :y="48" :delay="0.15">
            <span class="beep2-qr-row">
              <span class="beep2-qr-card">
                <img :src="qrSrc" alt="" class="beep2-qr-img">
              </span>
              <span class="beep2-qr-stores">
                <p class="beep2-qr-cap">{{ copy.downloadLabel }}</p>
                <img
                  src="/images/home/beep-badge-appstore.svg"
                  alt="Download on the App Store"
                  width="120"
                  height="40"
                  class="beep2-badge beep2-badge--apple"
                >
                <img
                  src="/images/home/beep-badge-googleplay.svg"
                  alt="Get it on Google Play"
                  width="119"
                  height="36"
                  class="beep2-badge beep2-badge--play"
                >
              </span>
            </span>
          </MotionReveal>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.beep2-stage {
  position: relative;
  width: 100%;
  max-width: 1512px;
  margin-inline: auto;
  aspect-ratio: 1512 / 607;
  container-type: inline-size;
}

.beep2-glow {
  position: absolute;
  left: calc(94.08% + max(0px, (100vw - 1512px) / 2));
  top: 64.01%;
  width: 101.33cqw;
  height: 101.33cqw;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.beep2-glow-img {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--d);
  height: var(--d);
  max-width: none;
  transform: translate(-50%, -50%);
}
.beep2-person {
  position: absolute;
  right: min(0px, calc((1512px - 100vw) / 2));
  top: -25.35%;
  width: 35.62%;
  height: 133.08%;
  pointer-events: none;
}
.beep2-person-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.beep2-person-video {
  position: absolute;
  inset: 0;
}
.beep2-col {
  position: absolute;
  left: 10.516%;
  top: 50%;
  transform: translateY(-50%);
  width: 42.46%;
  height: 65.24%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
}
.beep2-copy {
  display: flex;
  flex-direction: column;
  gap: 1.0582cqw;
  align-items: flex-start;
}
.beep2-wordmark {
  display: block;
  width: 7.341cqw;
  height: 2.6455cqw;
}
.beep2-text {
  display: flex;
  flex-wrap: wrap;
  white-space: pre-wrap;
  font-weight: 200;
  font-size: 1.0582cqw;
  line-height: 1.5873cqw;
  letter-spacing: 0.0106cqw;
  color: rgba(0, 0, 0, 0.6);
}
.beep2-text-lead {
  font-weight: 700;
}
.beep2-text--settled > :deep(span) {
  filter: none !important;
  transform: none !important;
  will-change: auto !important;
}

.beep2-qr {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.2646cqw;
}
.beep2-qr-row {
  display: flex;
  align-items: center;
  gap: 1.5873cqw;
}
.beep2-qr-stores {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 0.7937cqw;
}
.beep2-badge {
  display: block;
}
.beep2-badge--apple {
  width: 7.9143cqw;
  height: 2.6455cqw;
}
.beep2-badge--play {
  width: 7.8704cqw;
  height: 2.381cqw;
}
.beep2-qr-card {
  display: block;
  width: 11.706cqw;
  height: 12.302cqw;
  border-radius: 0.7937cqw;
  background: #fdfffe;
  overflow: hidden;
}
.beep2-qr-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.beep2-qr-cap {
  font-weight: 300;
  font-size: 1.3228cqw;
  line-height: 1.3228cqw;
  color: rgba(37, 64, 63, 0.5);
  white-space: nowrap;
}

@media (max-width: 1023.98px) {
  .beep2-stage {
    aspect-ratio: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem 1.5rem;
  }
  .beep2-glow {
    display: none;
  }
  .beep2-col {
    position: static;
    transform: none;
    width: 100%;
    height: auto;
    gap: 1.5rem;
  }
  .beep2-copy {
    gap: 1rem;
  }
  .beep2-wordmark {
    width: 6.9375rem;
    height: 2.5rem;
  }
  .beep2-text {
    font-size: 0.9375rem;
    line-height: 1.6;
    letter-spacing: 0.01em;
  }
  .beep2-qr {
    gap: 0.25rem;
  }
  .beep2-qr-card {
    width: 11rem;
    height: 11.625rem;
    border-radius: 0.75rem;
  }
  .beep2-qr-row {
    gap: 1rem;
  }
  .beep2-qr-stores {
    gap: 0.75rem;
  }
  .beep2-badge--apple {
    width: 6.5rem;
    height: 2.1667rem;
  }
  .beep2-badge--play {
    width: 6.4625rem;
    height: 1.9531rem;
  }
  .beep2-qr-cap {
    font-size: 1.125rem;
    line-height: 1.25rem;
  }
  .beep2-person {
    position: relative;
    order: 5;
    width: 100%;
    height: 17.5rem;
    border-radius: 1rem;
    overflow: hidden;
  }
  .beep2-person-img {
    object-position: 50% 18%;
  }
}
</style>
