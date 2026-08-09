<script setup lang="ts">
// Beep showcase V2 (Figma 987:21965). Light 1512×607 panel: dark Beep wordmark
// + bold-lead paragraph and a QR card on the left, the lifestyle photo bleeding
// off the top-right, and three concentric lime circles glowing behind it.
// Like HomeBeep, the desktop layout is a fixed 1512×607 coordinate stage that
// scales via container units; below `lg` it becomes an ordinary stacked flow.
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
</script>

<template>
  <section data-section="home-beep" class="overflow-hidden bg-[rgba(242,242,233,0.5)]">
    <div class="beep2-stage">
      <!-- Concentric lime glow (Ellipses 1022–1024): three #CAFF00 circles at
           4% alpha stacked into a stepped glow, all centred on the same point
           (x 1422.5, y 388.5 of the 1512×607 frame). One wrapper carries the
           outer circle's box; the smaller two centre inside it. -->
      <div class="beep2-glow" aria-hidden="true">
        <img :src="glowOuter" alt="" class="beep2-glow-img" style="--d: 100%">
        <img :src="glowMid" alt="" class="beep2-glow-img" style="--d: 73.28%">
        <img :src="glowInner" alt="" class="beep2-glow-img" style="--d: 49.26%">
      </div>

      <!-- Lifestyle photo — anchored to the right edge, head cropped by the
           section's top edge (Figma: y -153.9, h 807.8 in a 607 frame). -->
      <div class="beep2-person" aria-hidden="true">
        <NuxtImg
          src="/images/home/beep-lifestyle-v2.png"
          alt=""
          sizes="sm:100vw md:560px lg:760px"
          class="beep2-person-img"
        />
      </div>

      <!-- Text column: wordmark + paragraph on top, QR card at the bottom of a
           396px band vertically centred on the stage. -->
      <div class="beep2-col">
        <div class="beep2-copy">
          <img :src="wordmark" :alt="t('hero.wordmarkAlt')" class="beep2-wordmark">
          <p class="beep2-text">
            <span class="beep2-text-lead">{{ copy.lead }}</span>
            {{ ' ' }}<span>{{ copy.rest }}</span>
          </p>
        </div>

        <div class="beep2-qr">
          <span class="beep2-qr-card">
            <img src="/images/home/beep-qr.svg" alt="" class="beep2-qr-img">
          </span>
          <span class="beep2-qr-cap">Beep wallet</span>
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
  left: 94.08%;
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

/* Photo — right-anchored, w 538.6/1512, spans y -153.9 → 653.9 of 607 */
.beep2-person {
  position: absolute;
  right: 0;
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
  font-weight: 200;
  font-size: 1.0582cqw; /* 16px */
  line-height: 1.5873cqw; /* 24px */
  letter-spacing: 0.0106cqw; /* 0.16px */
  color: rgba(0, 0, 0, 0.6);
}
.beep2-text-lead {
  font-weight: 700;
}

/* QR block — 177px card, white, r12, caption 20px @ #25403f/50 */
.beep2-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2646cqw; /* 4px */
}
.beep2-qr-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 11.706cqw; /* 177px */
  height: 12.302cqw; /* 186px */
  border-radius: 0.7937cqw; /* 12px */
  background: #fdfffe;
  overflow: hidden;
}
.beep2-qr-img {
  display: block;
  width: 79.1%; /* ≈140px of 177 — the QR art inside the card */
  height: auto;
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
  /* Photo becomes an in-flow banner, lime glow dropped with the stage. */
  .beep2-person {
    position: static;
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
