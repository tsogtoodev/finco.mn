<script setup lang="ts">
// Static map placeholder with a pin + "open in Google Maps" link. A real
// static-tile provider (Mapbox/Google Static) can be wired in P7.5 — no API
// key needed for this link-based version.
const props = defineProps<{ lat: number; lng: number; label?: string }>()
const mapsUrl = computed(() => `https://www.google.com/maps?q=${props.lat},${props.lng}`)
</script>

<template>
  <a
    :href="mapsUrl"
    target="_blank"
    rel="noopener"
    class="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-secondary to-muted ring-1 ring-black/5"
  >
    <!-- faux street grid -->
    <div class="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--color-input)_1px,transparent_1px),linear-gradient(90deg,var(--color-input)_1px,transparent_1px)] [background-size:40px_40px]" />
    <div class="relative flex flex-col items-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform group-hover:-translate-y-1">
        <Icon name="lucide:map-pin" class="size-6" />
      </span>
      <span class="mt-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground shadow-2xs">
        {{ label }}
      </span>
    </div>
  </a>
</template>
