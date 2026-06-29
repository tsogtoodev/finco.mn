<script setup lang="ts">
// Beep showcase (Figma 1:14222 → card 1:14223). Pixel-exact recreation of the
// 1440×704 artboard: solid #0f2c23 card with a baked pill-cluster raster, the
// lifestyle photo bleeding off the right, a lime halftone field, the Beep
// wordmark, heading copy and a permanent glass info bar. The whole card is a
// fixed 1440×704 coordinate stage that scales proportionally via container
// units, so it matches Figma exactly at ≥1440 and shrinks faithfully below.
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section data-section="home-beep" class="bg-white px-6 py-10">
    <div class="mx-auto w-full max-w-[1440px]">
      <div class="beep-card">
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
            <h2 class="beep-title">{{ t('home.beep.heading') }}</h2>
            <p class="beep-subtext">{{ t('home.beep.subtext') }}</p>
          </div>

          <!-- Info bar -->
          <div class="beep-bar">
            <div class="beep-bar-inner">
              <p class="beep-bar-text">
                <span class="beep-bar-lead">{{ t('home.beep.expandLead') }}</span>
                {{ ' ' }}<span class="beep-bar-rest">{{ t('home.beep.expandRest') }}</span>
              </p>
              <div class="beep-bar-actions">
                <button type="button" class="beep-btn beep-btn--download">
                  <img src="/images/home/beep-playstore.svg" alt="" aria-hidden="true" class="beep-store-icon beep-store-icon--play">
                  <img src="/images/home/beep-apple.svg" alt="" aria-hidden="true" class="beep-store-icon beep-store-icon--apple">
                  <span class="beep-btn-label">{{ t('home.beep.appDownload') }}</span>
                </button>
                <NuxtLink :to="localePath('/products')" class="beep-btn">
                  <span class="beep-btn-label">{{ t('common.learnMore') }}</span>
                  <Icon name="lucide:arrow-right" class="beep-arrow" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

/* Lifestyle photo — left 776.29 top -71.45 w 663.709 h 775.564 */
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
</style>
