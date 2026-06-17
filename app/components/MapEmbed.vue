<script setup lang="ts">
// Static tilted map base + an animated, continuously spinning 3D pin layered
// on top. The pin strategy is swappable: today it's a CSS 3D teardrop (two
// faces + a thickness edge so it never fully vanishes edge-on). Drop in a
// Lottie/WebM here later without touching the explorer.
//
// Animation: the pin rotates a full 360° on its vertical (Y) axis, 2.75s,
// linear, seamless loop — with a soft red glow + ground shadow. Honors
// prefers-reduced-motion (spin + bob stop, pin faces front).
const props = withDefaults(
  defineProps<{
    mapImage?: string
    pin?: { x: number; y: number }
    label?: string
    lat?: number
    lng?: number
    /** Accessible description of the map. */
    ariaLabel?: string
  }>(),
  { pin: () => ({ x: 0.5, y: 0.5 }) },
)

const mapsUrl = computed(() =>
  props.lat != null && props.lng != null
    ? `https://www.google.com/maps?q=${props.lat},${props.lng}`
    : undefined,
)

const pinStyle = computed(() => ({
  left: `${props.pin.x * 100}%`,
  top: `${props.pin.y * 100}%`,
}))
</script>

<template>
  <component
    :is="mapsUrl ? 'a' : 'div'"
    :href="mapsUrl"
    :target="mapsUrl ? '_blank' : undefined"
    :rel="mapsUrl ? 'noopener' : undefined"
    :aria-label="ariaLabel"
    class="group relative block overflow-hidden rounded-[24px] ring-1 ring-black/5"
  >
    <!-- static tilted map base -->
    <NuxtImg
      v-if="mapImage"
      :src="mapImage"
      :alt="ariaLabel || ''"
      width="828"
      height="691"
      class="size-full object-cover"
      sizes="sm:100vw md:50vw lg:560px"
    />
    <div v-else class="size-full bg-gradient-to-br from-secondary to-muted" />

    <!-- animated pin (anchored by its tip at pin x/y) -->
    <div class="map-pin" :style="pinStyle">
      <span class="pin-glow" aria-hidden="true" />
      <span class="pin-shadow" aria-hidden="true" />
      <span class="pin-bob">
        <span class="pin-3d">
          <svg class="pin-face pin-front" viewBox="0 0 40 52" fill="none" aria-hidden="true">
            <path
              d="M20 1.5C9.5 1.5 1 9.8 1 20.1c0 7 5.4 14.4 9.7 19.4 3 3.5 5.6 6.2 7.2 8.2.6.8 1.6 1.3 2.1 1.3s1.5-.5 2.1-1.3c1.6-2 4.2-4.7 7.2-8.2C33.6 34.5 39 27.1 39 20.1 39 9.8 30.5 1.5 20 1.5Z"
              fill="url(#pinGrad)"
              stroke="rgba(255,255,255,0.35)"
              stroke-width="1"
            />
            <circle cx="20" cy="20" r="7.5" fill="rgba(255,255,255,0.9)" />
            <circle cx="20" cy="20" r="4" fill="url(#pinGrad)" />
            <defs>
              <linearGradient id="pinGrad" x1="6" y1="3" x2="34" y2="48" gradientUnits="userSpaceOnUse">
                <stop stop-color="#b497f8" />
                <stop offset="0.55" stop-color="#7b4fe6" />
                <stop offset="1" stop-color="#5a2fd6" />
              </linearGradient>
            </defs>
          </svg>
          <svg class="pin-face pin-back" viewBox="0 0 40 52" fill="none" aria-hidden="true">
            <path
              d="M20 1.5C9.5 1.5 1 9.8 1 20.1c0 7 5.4 14.4 9.7 19.4 3 3.5 5.6 6.2 7.2 8.2.6.8 1.6 1.3 2.1 1.3s1.5-.5 2.1-1.3c1.6-2 4.2-4.7 7.2-8.2C33.6 34.5 39 27.1 39 20.1 39 9.8 30.5 1.5 20 1.5Z"
              fill="#5126c6"
            />
          </svg>
          <span class="pin-edge" aria-hidden="true" />
        </span>
      </span>
    </div>
  </component>
</template>

<style scoped>
.map-pin {
  position: absolute;
  width: 76px;
  height: 99px;
  /* anchor the pin tip at (x, y) */
  transform: translate(-50%, -100%);
  transform-style: preserve-3d;
  perspective: 320px;
  z-index: 10;
  transition:
    left 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* soft red glow around the head */
.pin-glow {
  position: absolute;
  left: 50%;
  top: 38%;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  border-radius: 9999px;
  background: radial-gradient(
    circle,
    rgba(244, 63, 94, 0.55) 0%,
    rgba(244, 63, 94, 0.28) 38%,
    rgba(244, 63, 94, 0) 70%
  );
  filter: blur(2px);
  pointer-events: none;
}

/* ground shadow beneath the tip */
.pin-shadow {
  position: absolute;
  left: 50%;
  bottom: -8px;
  width: 44px;
  height: 13px;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: rgba(20, 12, 60, 0.32);
  filter: blur(2.5px);
  animation: pin-shadow-pulse 2.75s ease-in-out infinite;
  pointer-events: none;
}

/* gentle float above the marker */
.pin-bob {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: pin-bob 2.75s ease-in-out infinite;
}

/* the spinning body */
.pin-3d {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: pin-spin 2.75s linear infinite;
}

.pin-face {
  position: absolute;
  inset: 0;
  width: 76px;
  height: 99px;
  backface-visibility: hidden;
  filter: drop-shadow(0 6px 8px rgba(40, 20, 90, 0.35));
}
.pin-back {
  transform: rotateY(180deg);
}

/* thin side so the pin keeps volume when the faces turn edge-on */
.pin-edge {
  position: absolute;
  left: 50%;
  top: 2px;
  width: 12px;
  height: 84px;
  transform: translateX(-50%) rotateY(90deg);
  border-radius: 9999px 9999px 9999px 3px;
  background: linear-gradient(180deg, #7b4fe6, #4a22b8);
}

@keyframes pin-spin {
  to {
    transform: rotateY(360deg);
  }
}
@keyframes pin-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
@keyframes pin-shadow-pulse {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.32;
  }
  50% {
    transform: translateX(-50%) scale(0.82);
    opacity: 0.22;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pin-3d,
  .pin-bob,
  .pin-shadow {
    animation: none;
  }
  .pin-3d {
    transform: none;
  }
}
</style>
