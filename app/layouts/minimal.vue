<script setup lang="ts">
// Reduced chrome: announcement + header, NO footer (Figma exam page).
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AnnouncementBar />
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
