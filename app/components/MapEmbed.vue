<script setup lang="ts">
// Static tilted map base + an animated 3D pin layered on top. The pin is a
// self-animating Spline scene rendered client-side via <SplineScene>; on the
// server (and before hydration / where WebGL is unavailable) we fall back to a
// static SVG teardrop so a marker is always present. The pin is anchored by its
// tip at pin (x, y) and is purely decorative — pointer-events are disabled so
// clicks fall through to the map link beneath it.
//
// The root carries `min-h-64`: the only in-flow child is the `size-full` base,
// so without an explicit height from the call site the whole thing would
// collapse to 0px and disappear (the pin is absolute and contributes nothing).
// Call sites that want a different height just pass one — `h-*` beats `min-h`.
const props = withDefaults(
  defineProps<{
    mapImage?: string
    pin?: { x: number; y: number }
    label?: string
    lat?: number
    lng?: number
    /** Accessible description of the map. */
    ariaLabel?: string
    /** Exported .splinecode pin scene URL. */
    pinScene?: string
  }>(),
  {
    pin: () => ({ x: 0.5, y: 0.5 }),
    pinScene: 'https://prod.spline.design/jz0xkk2dguy2XY4p/scene.splinecode?timestamp=20260812040000',
  },
)

// Live pin on capable devices, the static teardrop everywhere else. This scene had
// no responsive gate at all, so phones on /branches and /contact were downloading
// the runtime and opening a WebGL context for a decorative marker.
const splineEnabled = useSplineEnabled()

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
    class="group relative block min-h-64 overflow-hidden rounded-[24px] ring-1 ring-black/5"
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

    <!-- animated Spline pin (anchored by its tip at pin x/y) -->
    <div class="map-pin" :style="pinStyle">
      <SplineScene v-if="splineEnabled" :scene="pinScene" class="pin-scene" no-hover />
      <!-- SSR / pre-hydration / low-end marker. This is the teardrop the header
           comment always promised: the ClientOnly here had no #fallback, so until
           the runtime finished loading — and on any device that skips the scene —
           the map had no marker at all. `.pin-fallback` was already styled for it. -->
      <svg
        v-else
        class="pin-fallback"
        viewBox="0 0 132 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M66 4C31.8 4 4 31.8 4 66c0 42.4 51.6 91 60.1 98.8a2.8 2.8 0 0 0 3.8 0C76.4 157 128 108.4 128 66 128 31.8 100.2 4 66 4Z"
          fill="url(#pin-body)"
        />
        <circle cx="66" cy="64" r="24" fill="#fff" fill-opacity="0.92" />
        <defs>
          <linearGradient id="pin-body" x1="66" y1="4" x2="66" y2="166" gradientUnits="userSpaceOnUse">
            <stop stop-color="#6b4fff" />
            <stop offset="1" stop-color="#4c41d8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </component>
</template>

<style scoped>
.map-pin {
  position: absolute;
  /* Scale with the map instead of staying at the desktop 132px: the pin is
     anchored by its tip, so at a mobile map height a fixed 168px pin reaches
     above the top edge and gets cut off by the root's overflow-hidden. 28%
     reaches the 132px cap by ~470px, so every desktop map is pixel-identical
     to before; the lower bound stops it shrinking to a dot. */
  width: clamp(72px, 28%, 132px);
  aspect-ratio: 132 / 168;
  height: auto;
  /* anchor the pin tip at (x, y) */
  transform: translate(-50%, -100%);
  z-index: 10;
  /* decorative: let clicks reach the map link beneath */
  pointer-events: none;
  transition:
    left 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.pin-scene {
  width: 100%;
  height: 100%;
}

/* SSR / pre-hydration marker */
.pin-fallback {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 6px 8px rgba(40, 20, 90, 0.35));
}
</style>
