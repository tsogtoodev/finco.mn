<script setup lang="ts">
// Full site chrome: announcement bar + header + content + footer.
// Pages with a dark image hero opt into the transparent overlay nav via
// `definePageMeta({ transparentHeader: true })`; everything else stays solid.
const route = useRoute()
const transparentHeader = computed(() => route.meta.transparentHeader === true)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AnnouncementBar />
    <SiteHeader :transparent="transparentHeader" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
