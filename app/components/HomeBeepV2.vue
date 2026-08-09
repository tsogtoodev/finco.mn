<script setup lang="ts">
// Beep showcase V2 (Figma 987:21965). Light 1512×607 panel: dark Beep wordmark
// + bold-lead paragraph and a QR card on the left, the lifestyle photo bleeding
// off the top-right, and three concentric lime circles glowing behind it.
// Like HomeBeep, the desktop layout is a fixed 1512×607 coordinate stage that
// scales via container units; below `lg` it becomes an ordinary stacked flow.
import { useInView } from 'motion-v'
import glowOuter from '~/assets/images/beep2-glow-outer.svg'
import glowMid from '~/assets/images/beep2-glow-mid.svg'
import glowInner from '~/assets/images/beep2-glow-inner.svg'
import wordmark from '~/assets/images/beep-wordmark-dark.svg'

const { t } = useI18n()

// Same copy source as HomeBeep: the home doc's beep group, i18n fallback.
// The design's paragraph is exactly expandLead (bold) + expandRest (light).
const page = await usePageContent('home')
const copy = computed(() => ({
  lead: page.value?.beep?.expandLead ?? t('home.beep.expandLead'),
  rest: page.value?.beep?.expandRest ?? t('home.beep.expandRest'),
}))

// ── Paragraph reveal ─────────────────────────────────────────────────────────
// BlurText can't render this paragraph: the bold lead and light rest must flow
// INLINE through one wrapping text block, and each <BlurText> is its own flex
// container — two of them stack (or shrink side-by-side) instead of flowing.
// So the paragraph rebuilds BlurText's word reveal inline: same keyframes, same
// per-word stagger, same settle cleanup — with the lead's words styled bold.
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

// Same trick as BlurText's `blurtext-settled`: motion leaves inline
// `filter: blur(0px)` / `translateY(0)` on every word, each holding a
// compositing layer that degrades text antialiasing — clear them once done.
const textSettled = ref(false)

// ── One-shot video ───────────────────────────────────────────────────────────
// The photo slot plays /videos/beep.mp4 once, starting the moment the section
// reaches the middle of the screen. The -50% rootMargin collapses the IO's
// viewport to its horizontal centre line, so "intersecting" means exactly
// "the section straddles mid-screen". The image stays layered underneath as
// the frame shown until the video has data (and forever on reduced-motion).
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
      // Set the property, not just the attribute: the `muted` content attribute
      // only applies at element creation, and autoplay policy needs the real
      // property true at play() time.
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
        <!-- <img :src="glowInner" alt="" class="beep2-glow-img" style="--d: 49.26%"> -->
      </div>

      <div class="beep2-person" aria-hidden="true">
        <!-- <NuxtImg
          src="/images/home/beep-lifestyle-v2.png"
          alt=""
          sizes="sm:100vw md:560px lg:760px"
          class="beep2-person-img"
        /> -->
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

      <!-- Text column: wordmark + paragraph on top, QR card at the bottom of a
           396px band vertically centred on the stage. -->
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
            <span class="beep2-qr-card">
              <img src="/images/home/beep-qr-v2.png" alt="" class="beep2-qr-img">
            </span>
          </MotionReveal>
          <BlurText
            text="Beep wallet"
            as="p"
            animate-by="words"
            :delay="45"
            :start-delay="0.3"
            class="beep2-qr-cap justify-center"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 1512×607 stage; cqw resolves against the stage width (=1512px at full size). */
.beep2-stage {
  position: relative;
  width: 100%;
  max-width: 1512px;
  margin-inline: auto;
  aspect-ratio: 1512 / 607;
  container-type: inline-size;
}

/* Glow — outer circle box: d 1532.12 (101.33cqw) centred at 94.08% / 64.01% */
.beep2-glow {
  position: absolute;
  /* Tracks the photo's gutter shift so the circles stay centred behind it. */
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

/* Photo — right-anchored, w 538.6/1512, spans y -153.9 → 653.9 of 607.
   `right` compensates for the stage's centering gutter: above 1512px the stage
   stops short of the screen edge, and a photo pinned to the STAGE edge leaves
   a strip of empty panel to its right — the design keeps it flush with the
   frame edge, so shift it right by the gutter width ((100vw - 1512) / 2).
   100vw includes the scrollbar, so this can overshoot by ~15px; the section's
   overflow-hidden clips that sliver of the photo, which is already a crop. */
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
/* Overlays the image in the same box; transparent until it has frames. */
.beep2-person-video {
  position: absolute;
  inset: 0;
}

/* Text column — left 159/1512, a 396px (65.24%) band centred vertically,
   wordmark+copy at the top, QR card pushed to its bottom. */
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
  gap: 1.0582cqw; /* 16px */
  align-items: flex-start;
}
.beep2-wordmark {
  display: block;
  width: 7.341cqw; /* 110.99px */
  height: 2.6455cqw; /* 40px */
}
.beep2-text {
  display: flex;
  flex-wrap: wrap;
  white-space: pre-wrap; /* keep each word's trailing space from collapsing */
  font-weight: 200;
  font-size: 1.0582cqw; /* 16px */
  line-height: 1.5873cqw; /* 24px */
  letter-spacing: 0.0106cqw; /* 0.16px */
  color: rgba(0, 0, 0, 0.6);
}
.beep2-text-lead {
  font-weight: 700;
}
/* Same as BlurText's .blurtext-settled: release the per-word layers. */
.beep2-text--settled > :deep(span) {
  filter: none !important;
  transform: none !important;
  will-change: auto !important;
}

/* QR block — 177px card, white, r12, caption 20px @ #25403f/50 */
.beep2-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2646cqw; /* 4px */
}
.beep2-qr-card {
  display: block;
  width: 11.706cqw; /* 177px */
  height: 12.302cqw; /* 186px */
  border-radius: 0.7937cqw; /* 12px */
  background: #fdfffe;
  overflow: hidden;
}
.beep2-qr-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Figma: the QR art fills the card edge-to-edge */
}
.beep2-qr-cap {
  font-weight: 300;
  font-size: 1.3228cqw; /* 20px */
  line-height: 1.3228cqw;
  color: rgba(37, 64, 63, 0.5);
}

/* ── Mobile / tablet (<1024px): stacked flow, px type, stage layers rehomed ── */
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
    width: 6.9375rem; /* 111px */
    height: 2.5rem;
  }
  .beep2-text {
    font-size: 0.9375rem; /* 15px */
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
  .beep2-qr-cap {
    font-size: 1.125rem;
    line-height: 1.25rem;
  }
  /* Photo becomes an in-flow banner, lime glow dropped with the stage.
     `relative`, not `static`: the video overlay anchors to this box. */
  .beep2-person {
    position: relative;
    order: 5;
    width: 100%;
    height: 17.5rem;
    border-radius: 1rem;
    overflow: hidden;
  }
  .beep2-person-img {
    object-position: 50% 18%; /* keep the phone-in-pocket framing in the crop */
  }
}
</style>
