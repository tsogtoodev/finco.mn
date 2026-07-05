<script setup lang="ts">
// Full site chrome: announcement bar + header + content + footer.
// Pages with a dark image hero opt into the transparent overlay nav via
// `definePageMeta({ transparentHeader: true })`; everything else stays solid.
const route = useRoute()
const transparentHeader = computed(() => route.meta.transparentHeader === true)
// FAB shows everywhere unless a page opts out with
// `definePageMeta({ floatingActions: false })`.
const showFloatingActions = computed(() => route.meta.floatingActions !== false)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <!-- AnnouncementBar is rendered inside SiteHeader so it reveals/hides with the nav. -->
    <SiteHeader :transparent="transparentHeader" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <FloatingActions v-if="showFloatingActions" />
  </div>
</template>
