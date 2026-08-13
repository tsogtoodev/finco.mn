<script setup lang="ts">
const route = useRoute()
const transparentHeader = computed(() => route.meta.transparentHeader === true)
const showFloatingActions = computed(() => route.meta.floatingActions !== false)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <SiteHeader :transparent="transparentHeader" />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <FloatingActions v-if="showFloatingActions" />
    <AutoNextNews />
    <DevOnly>
      <FpsMeter />
    </DevOnly>
  </div>
</template>
