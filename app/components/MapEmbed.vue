<script setup lang="ts">
// Static tilted map base + an animated 3D pin layered on top. The pin is a
// self-animating Spline scene rendered client-side via <SplineScene>; on the
// server (and before hydration / where WebGL is unavailable) we fall back to a
// static SVG teardrop so a marker is always present. The pin is anchored by its
// tip at pin (x, y) and is purely decorative — pointer-events are disabled so
// clicks fall through to the map link beneath it.
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
    pinScene: 'https://prod.spline.design/jz0xkk2dguy2XY4p/scene.splinecode',
  },
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

    <!-- animated Spline pin (anchored by its tip at pin x/y) -->
    <div class="map-pin" :style="pinStyle">
      <ClientOnly>
        <SplineScene :scene="pinScene" class="pin-scene" />
      </ClientOnly>
    </div>
  </component>
</template>

<style scoped>
.map-pin {
  position: absolute;
  width: 132px;
  height: 168px;
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
