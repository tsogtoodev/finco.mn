<script setup lang="ts">
// Full site chrome: announcement bar + header + content + footer.
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AnnouncementBar />
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
